#!/usr/bin/env tsx
// scripts/pipeline.ts — Pipeline multi-agents pour créer un nouveau jeu
//
// Enchaîne 3 agents de façon autonome :
//   Phase 1+2 : Agent Spec   → conversation multi-tours → docs/games/[id].md
//   Phase 3   : Agent Design → appel unique             → docs/games/[id]_design.md
//   Phase 4   : Agent Dev    → appel unique             → ~9 fichiers du jeu
//
// Usage :
//   npx tsx scripts/pipeline.ts "Pays Tropiques"
//   npx tsx scripts/pipeline.ts "Quiz logos de marques"
//
// Seul checkpoint humain : valider la spec (Phase 2) avant que le code soit écrit.

import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { config as loadEnv } from 'dotenv'

loadEnv({ path: '.env.local' })

// ─── Config ───────────────────────────────────────────────────────────────────

const ROOT = process.cwd()

// Haiku pour la phase spec (conversationnelle, rate limit 10x plus élevé)
// Sonnet pour design + dev (qualité créative et technique requise)
const MODEL_SPEC = 'claude-haiku-4-5-20251001'
const MODEL_MAIN = 'claude-sonnet-4-6'

const MAX_TOKENS: Record<string, number> = {
  spec:   4000,
  design: 6000,
  dev:    16000,
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface PhaseResult {
  output:       string
  filesWritten: string[]
}

// ─── Helpers filesystem ───────────────────────────────────────────────────────

function readFile(filePath: string): string {
  const full = path.join(ROOT, filePath)
  if (!fs.existsSync(full)) return `[FICHIER MANQUANT: ${filePath}]`
  return fs.readFileSync(full, 'utf-8')
}

function writeOutputFile(filePath: string, content: string): void {
  const full = path.join(ROOT, filePath)
  fs.mkdirSync(path.dirname(full), { recursive: true })
  fs.writeFileSync(full, content, 'utf-8')
  console.log(`  ✅  Écrit : ${filePath}`)
}

function toGameId(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40)
}

// Extrait uniquement le bloc TypeScript de GAME_CONTRACT.md (~400 tokens vs ~1500)
function extractGameModuleInterface(): string {
  const full = readFile('docs/GAME_CONTRACT.md')
  const start = full.indexOf('```typescript')
  const end   = full.indexOf('```', start + 1)
  if (start === -1 || end === -1) return full.slice(0, 1500)
  return full.slice(start, end + 3)
}

function listExistingGameSpecs(): string {
  const dir = path.join(ROOT, 'docs/games')
  if (!fs.existsSync(dir)) return '(aucun jeu existant)'
  return fs
    .readdirSync(dir)
    .filter(f => f.endsWith('.md') && !f.startsWith('_') && !f.endsWith('_design.md'))
    .map(f => `- ${f}`)
    .join('\n')
}

function printSep(char = '━', len = 54): void {
  console.log(char.repeat(len))
}

// ─── Extraction de fichiers depuis la réponse de l'agent ─────────────────────
//
// Les agents encadrent chaque fichier avec :
//   === FICHIER: chemin/du/fichier.ts ===
//   [contenu]
//   === FIN FICHIER ===
//
// Le pipeline extrait et écrit automatiquement ces fichiers.

function extractAndWriteFiles(output: string): string[] {
  const written: string[] = []
  const regex = /=== FICHIER: (.+?) ===\n([\s\S]+?)\n=== FIN FICHIER ===/g
  let match: RegExpExecArray | null

  while ((match = regex.exec(output)) !== null) {
    const filePath = match[1].trim()
    const content  = match[2]
    writeOutputFile(filePath, content)
    written.push(filePath)
  }

  return written
}

// Instruction injectée dans chaque appel pour forcer le format fichier
const FILE_MARKER_INSTRUCTION = `

━━━ INSTRUCTION PIPELINE (priorité absolue) ━━━
Quand tu génères le contenu d'un fichier, encadre-le EXACTEMENT ainsi :

=== FICHIER: chemin/depuis/racine/projet ===
[contenu complet, sans troncature]
=== FIN FICHIER ===

Exemple valide :
=== FICHIER: docs/games/pays_tropiques.md ===
# Pays Tropiques — Spec
...
=== FIN FICHIER ===

RÈGLES :
- Ces marqueurs sont obligatoires pour CHAQUE fichier généré.
- Ne jamais tronquer le contenu (même pour les longs fichiers).
- Le chemin commence depuis la racine du projet, jamais depuis src/ seul.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`

// ─── Construction du prompt système ───────────────────────────────────────────

function buildContext(files: Record<string, string>): string {
  return Object.entries(files)
    .map(([label, content]) => `\n\n---\n## Contexte : ${label}\n\n${content}`)
    .join('')
}

// ─── Appel API Anthropic avec streaming (raw fetch — même approche que agent.ts) ──
// Le SDK Anthropic entre en conflit avec readline actif → on utilise fetch + SSE

interface SseDelta {
  type: 'content_block_delta'
  delta: { type: 'text_delta'; text: string }
}

function isSseDelta(v: unknown): v is SseDelta {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (o['type'] !== 'content_block_delta') return false
  const d = o['delta'] as Record<string, unknown> | undefined
  return d?.['type'] === 'text_delta' && typeof d?.['text'] === 'string'
}

async function callAgent(
  systemPrompt: string,
  messages: Message[],
  phase: keyof typeof MAX_TOKENS,
  model = MODEL_MAIN
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY!
  console.log(`\n  [pipeline] appel API — phase:${phase} model:${model.split('-')[1]} messages:${messages.length} max_tokens:${MAX_TOKENS[phase]}`)

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'Content-Type':    'application/json',
      'x-api-key':       apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      model,
      max_tokens: MAX_TOKENS[phase],
      stream:     true,
      system:     systemPrompt,
      messages,
    }),
  })

  if (res.status === 429) {
    console.log('\n  ⏳  Rate limit — attente 60s avant retry...')
    await new Promise(r => setTimeout(r, 60_000))
    return callAgent(systemPrompt, messages, phase, model)
  }

  if (!res.ok) {
    const errText = await res.text()
    console.error(`\n❌  API HTTP ${res.status} : ${errText}`)
    throw new Error(`API error ${res.status}: ${errText}`)
  }

  if (!res.body) throw new Error('Pas de body dans la réponse API')

  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let output = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      for (const line of event.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue
        try {
          const parsed: unknown = JSON.parse(data)
          if (isSseDelta(parsed)) {
            process.stdout.write(parsed.delta.text)
            output += parsed.delta.text
          }
        } catch { /* ignore les événements SSE malformés */ }
      }
    }
  }

  console.log(`\n  [pipeline] réponse reçue — ${output.length} caractères`)

  if (!output.trim()) {
    console.warn('  ⚠️  Réponse vide — vérifie les logs ci-dessus')
  }

  return output
}

// ─── Lecture input terminal ───────────────────────────────────────────────────
// Interface unique pour toute la session — ne jamais la fermer entre les questions.
// Fermer readline après chaque question met stdin en pause et coupe le streaming API.

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => resolve(answer.trim()))
  })
}

function isValidation(text: string): boolean {
  const triggers = ['valide', 'go', 'ok', 'oui', 'yes', "c'est bon", 'parfait', 'lancé']
  return triggers.some(t => text.toLowerCase().includes(t))
}

// Garde uniquement les N derniers messages pour éviter l'explosion du contexte
function trimHistory(messages: Message[], keep = 6): Message[] {
  if (messages.length <= keep) return messages
  return [messages[0], ...messages.slice(-keep + 1)]
}

// ─── PHASE 1+2 — Spec (conversation multi-tours) ─────────────────────────────

async function runSpecPhase(idea: string, gameId: string): Promise<PhaseResult> {
  console.log('\n')
  printSep('═')
  console.log('📋  PHASE 1+2 — INTAKE & SPEC')
  console.log('    L\'agent va poser 5 questions puis écrire la spec.')
  printSep('═')

  // Prompt ciblé : uniquement l'intake + format spec.
  // PAS PIPELINE.md entier → trop long et contient des instructions de génération de code.
  const systemPrompt = `Tu es l'agent Spec de Kclo Games. Ton rôle : comprendre une idée de jeu et produire une spec structurée.

## Étape 1 — 5 questions (une par une, dans l'ordre)

Pose exactement ces 5 questions, une à la fois. Arrête-toi si la réponse a déjà été donnée.

Q1 — Contenu : "Quel contenu les joueurs voient-ils pendant un round ? (image, texte, son...) Y a-t-il des thèmes ?"
Q2 — Round : "Décris un round de A à Z : que voit le joueur, que fait-il, comment ça se termine ?"
Q3 — Scoring : "Comment les points sont calculés ? La vitesse compte ? Donne des chiffres concrets."
Q4 — Config : "Qu'est-ce que le host peut régler avant de lancer ? (rounds, thèmes, durée...)"
Q5 — Limites : "Que se passe-t-il si personne ne répond avant le timer ? Comment départager une égalité ?"

## Étape 2 — Écrire la spec

Une fois les 5 questions répondues, génère la spec ET écris-la immédiatement dans un fichier.
Utilise OBLIGATOIREMENT ce format pour le fichier :

=== FICHIER: docs/games/${gameId}.md ===
# ${gameId} — Spec
[contenu complet de la spec]
=== FIN FICHIER ===

Après le fichier, écris exactement : "Valide cette spec ou dis-moi ce que tu veux changer."

## RÈGLES ABSOLUES
- NE GÉNÈRE JAMAIS de code TypeScript ou SQL — uniquement la spec en markdown
- Pose UNE question à la fois
- Maximum 5 questions avant d'écrire la spec

## Jeux existants (à ne pas dupliquer)
${listExistingGameSpecs()}

## Interface GameModule (contraintes techniques)
${extractGameModuleInterface()}
`

  const messages: Message[] = [
    { role: 'user', content: `J'ai une idée de jeu : ${idea}` },
  ]

  let fullOutput = ''

  while (true) {
    console.log('\n\n🤖  Agent Spec :\n')
    const response = await callAgent(systemPrompt, trimHistory(messages), 'spec', MODEL_SPEC)
    fullOutput += '\n' + response
    messages.push({ role: 'assistant', content: response })

    // Si le fichier spec a été écrit → extraire et sortir immédiatement
    const filesAlreadyWritten = extractAndWriteFiles(fullOutput)
    if (filesAlreadyWritten.some(f => f.startsWith('docs/games/') && !f.endsWith('_design.md'))) {
      console.log('\n\n💬  Valide cette spec ou dis tes corrections.')
      const answer = await prompt('→ ')
      if (isValidation(answer)) {
        console.log('\n✅  Spec validée — passage Phase 3 Design...\n')
        return { output: fullOutput, filesWritten: filesAlreadyWritten }
      }
      // Corrections → continuer
      messages.push({ role: 'user', content: answer })
      continue
    }

    // Spec prête mais pas encore écrite → demander validation
    const specPresented = response.includes('Valide cette spec') || response.includes('valide ou')
    if (specPresented) {
      const answer = await prompt('\n\n💬  Valide cette spec ? → ')
      if (isValidation(answer)) {
        // Demander l'écriture du fichier (appel unique, historique tronqué)
        messages.push({
          role: 'user',
          content: `Spec validée. Écris maintenant le fichier docs/games/${gameId}.md avec les marqueurs === FICHIER: ===. Ne génère PAS de code TypeScript.`,
        })
        console.log('\n🤖  Agent Spec (écriture fichier) :\n')
        const fileResponse = await callAgent(systemPrompt, trimHistory(messages, 4), 'spec', MODEL_SPEC)
        fullOutput += '\n' + fileResponse
        const filesWritten = extractAndWriteFiles(fullOutput)
        if (!filesWritten.some(f => f.startsWith('docs/games/'))) {
          const specPath = `docs/games/${gameId}.md`
          writeOutputFile(specPath, fullOutput.slice(-4000))
          filesWritten.push(specPath)
        }
        return { output: fullOutput, filesWritten }
      }
      messages.push({ role: 'user', content: answer })
      continue
    }

    // L'agent attend une réponse
    const answer = await prompt('\n\n💬  Ta réponse → ')
    messages.push({ role: 'user', content: answer })
  }
}

// ─── PHASE 3 — Design ─────────────────────────────────────────────────────────

async function runDesignPhase(gameId: string): Promise<PhaseResult> {
  console.log('\n')
  printSep('═')
  console.log('🎨  PHASE 3 — DESIGN')
  console.log('    L\'agent choisit les couleurs, les écrans, les composants.')
  printSep('═')

  const specContent = readFile(`docs/games/${gameId}.md`)

  if (specContent.startsWith('[FICHIER MANQUANT')) {
    console.error(`\n❌  Spec introuvable : docs/games/${gameId}.md`)
    console.error('    La Phase 2 n\'a pas écrit le fichier correctement.')
    process.exit(1)
  }

  const systemPrompt =
    readFile('agents/DESIGN_AGENT.md') +
    FILE_MARKER_INSTRUCTION +
    buildContext({
      'docs/DESIGN_SYSTEM.md':                       readFile('docs/DESIGN_SYSTEM.md'),
      [`docs/games/${gameId}.md (spec validée)`]:    specContent,
      'src/lib/games/theme.ts (thèmes existants)':   readFile('src/lib/games/theme.ts'),
      'Exemple GameView ELDU':                        readFile('src/components/games/eldu/GameView.tsx'),
      'Exemple GameView Undercover':                  readFile('src/components/games/undercover/GameView.tsx'),
    })

  const messages: Message[] = [{
    role: 'user',
    content: `Génère le brief design complet pour "${gameId}". Produis le fichier docs/games/${gameId}_design.md avec les marqueurs === FICHIER: ===.`,
  }]

  console.log('\n🤖  Agent Design :\n')
  const output = await callAgent(systemPrompt, messages, 'design')
  let filesWritten = extractAndWriteFiles(output)

  // Fallback
  if (!filesWritten.some(f => f.includes('_design.md'))) {
    console.log('\n  ⚠️  Marqueurs non détectés — écriture manuelle du brief design...')
    const designPath = `docs/games/${gameId}_design.md`
    writeOutputFile(designPath, output)
    filesWritten = [designPath]
  }

  return { output, filesWritten }
}

// ─── PHASE 4 — Dev ────────────────────────────────────────────────────────────

async function runDevPhase(gameId: string): Promise<PhaseResult> {
  console.log('\n')
  printSep('═')
  console.log('⚙️   PHASE 4 — DÉVELOPPEMENT')
  console.log('    L\'agent génère tous les fichiers du jeu.')
  printSep('═')

  const specContent   = readFile(`docs/games/${gameId}.md`)
  const designContent = readFile(`docs/games/${gameId}_design.md`)

  if (designContent.startsWith('[FICHIER MANQUANT')) {
    console.error(`\n❌  Brief design introuvable : docs/games/${gameId}_design.md`)
    process.exit(1)
  }

  const systemPrompt =
    readFile('agents/GAME_CREATOR.md') +
    FILE_MARKER_INSTRUCTION +
    buildContext({
      'docs/GAME_CONTRACT.md':                               readFile('docs/GAME_CONTRACT.md'),
      'docs/ARCHITECTURE.md':                                readFile('docs/ARCHITECTURE.md'),
      'docs/DESIGN_SYSTEM.md':                               readFile('docs/DESIGN_SYSTEM.md'),
      [`docs/games/${gameId}.md (spec)`]:                    specContent,
      [`docs/games/${gameId}_design.md (brief design)`]:     designContent,
      'src/lib/games/eldu/index.ts (exemple GameModule)':    readFile('src/lib/games/eldu/index.ts'),
      'src/components/games/eldu/GameView.tsx (exemple UI)': readFile('src/components/games/eldu/GameView.tsx'),
      'src/components/platform/RoomLobby.tsx':               readFile('src/components/platform/RoomLobby.tsx'),
      'src/lib/games/theme.ts':                              readFile('src/lib/games/theme.ts'),
      'src/app/page.tsx':                                    readFile('src/app/page.tsx'),
      'src/lib/games/registry.ts':                           readFile('src/lib/games/registry.ts'),
    })

  const messages: Message[] = [{
    role: 'user',
    content: `Génère tous les fichiers du jeu "${gameId}". Suis la spec et le brief design. Utilise === FICHIER: === pour chaque fichier. Commence par la migration SQL, puis les types, puis le GameModule, puis les routes API, puis le GameView, puis les modifications RoomLobby/page/theme/registry.`,
  }]

  console.log('\n🤖  Agent Dev :\n')
  const output = await callAgent(systemPrompt, messages, 'dev')
  const filesWritten = extractAndWriteFiles(output)

  if (filesWritten.length === 0) {
    console.log('\n  ⚠️  Aucun fichier extrait. L\'agent n\'a pas utilisé les marqueurs.')
    console.log('  ℹ️  Relis l\'output ci-dessus et crée les fichiers manuellement.')
  }

  return { output, filesWritten }
}

// ─── Rapport final ────────────────────────────────────────────────────────────

function printReport(
  gameId: string,
  spec:   PhaseResult,
  design: PhaseResult,
  dev:    PhaseResult
): void {
  const allFiles = [...spec.filesWritten, ...design.filesWritten, ...dev.filesWritten]

  console.log('\n')
  printSep('═')
  console.log(`✅  ${gameId.toUpperCase()} — Pipeline terminé`)
  printSep('═')
  console.log(`\n📁  Fichiers générés (${allFiles.length})`)
  allFiles.forEach(f => console.log(`    ${f}`))
  console.log(`
🗄️   À faire manuellement
    1. Supabase dashboard → SQL Editor → coller la migration
    2. npx tsx scripts/seed-${gameId}.ts   (si seed disponible)
    3. npm run build
    4. Tester une partie complète en local (2 onglets)

💾  Commit suggéré
    git add . && git commit -m "feat: add ${gameId} game"
`)
  printSep('═')
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const idea = process.argv[2]

  if (!idea || idea === '--help' || idea === '-h') {
    console.log(`
Usage : npx tsx scripts/pipeline.ts "<idée de jeu>" [--from spec|design|dev] [--force]

Options :
  --from spec    Repart depuis la phase Spec (efface et recommence la spec)
  --from design  Repart depuis la phase Design (spec existante conservée)
  --from dev     Repart depuis la phase Dev (spec + design conservés)
  --force        Repart de zéro même si les fichiers existent

Exemples :
  npm run pipeline "ISAM"                  → reprend là où c'était arrêté
  npm run pipeline "ISAM" --from design    → relance le design uniquement
  npm run pipeline "ISAM" --force          → repart de zéro
    `)
    process.exit(0)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('\n❌  ANTHROPIC_API_KEY manquante.')
    console.error('    → Ajoute-la dans .env.local : ANTHROPIC_API_KEY=sk-ant-...\n')
    process.exit(1)
  }

  const args   = process.argv.slice(3)
  const force  = args.includes('--force')
  const fromIdx = args.indexOf('--from')
  const fromPhase = fromIdx !== -1 ? args[fromIdx + 1] : null

  const gameId = toGameId(idea)

  const specFile   = path.join(ROOT, `docs/games/${gameId}.md`)
  const designFile = path.join(ROOT, `docs/games/${gameId}_design.md`)

  const hasSpec   = !force && fromPhase !== 'spec'   && fs.existsSync(specFile)
  const hasDesign = !force && fromPhase !== 'design' && fromPhase !== 'spec' && fs.existsSync(designFile)

  console.log('\n')
  printSep('═')
  console.log('🎮  PIPELINE KCLO GAMES — Création de jeu')
  console.log(`    Idée    : ${idea}`)
  console.log(`    Game ID : ${gameId}`)
  console.log(`    Spec    : ${MODEL_SPEC} (haiku)  ${hasSpec   ? '✅ déjà faite' : '⏳ à faire'}`)
  console.log(`    Design  : ${MODEL_MAIN} (sonnet) ${hasDesign ? '✅ déjà fait'  : '⏳ à faire'}`)
  console.log(`    Dev     : ${MODEL_MAIN} (sonnet) ⏳ à faire`)
  printSep('═')

  // Phase 1+2 — Spec (sautée si déjà produite)
  let specResult: PhaseResult
  if (hasSpec) {
    console.log(`\n⏭️   Phase Spec ignorée — fichier existant : docs/games/${gameId}.md`)
    specResult = { output: '', filesWritten: [`docs/games/${gameId}.md`] }
  } else {
    specResult = await runSpecPhase(idea, gameId)
  }

  // Phase 3 — Design (sautée si déjà produit)
  let designResult: PhaseResult
  if (hasDesign) {
    console.log(`⏭️   Phase Design ignorée — fichier existant : docs/games/${gameId}_design.md`)
    designResult = { output: '', filesWritten: [`docs/games/${gameId}_design.md`] }
  } else {
    designResult = await runDesignPhase(gameId)
  }

  // Phase 4 — Dev (toujours lancée, c'est le but du run)
  const devResult = await runDevPhase(gameId)

  printReport(gameId, specResult, designResult, devResult)
  rl.close()
}

main().catch((err: unknown) => {
  console.error('\n❌  Erreur pipeline :', err)
  rl.close()
  process.exit(1)
})

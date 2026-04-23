#!/usr/bin/env tsx
// scripts/agent.ts — Runner CLI pour appeler les agents du projet via l'API Anthropic
//
// Usage :
//   npx tsx scripts/agent.ts <agent> "<message>"
//   npm run agent <agent> "<message>"        (après init Next.js)
//
// Exemples :
//   npx tsx scripts/agent.ts orchestrator "J'ai une idée de jeu de logos de marques"
//   npx tsx scripts/agent.ts debug "Le scoreboard ne se met pas à jour en temps réel"
//   npx tsx scripts/agent.ts game-creator "Je veux un jeu de devinettes musicales"

import * as fs from 'fs'
import * as path from 'path'

// ─── Configuration des agents ────────────────────────────────────────────────
//
// Chaque agent a :
//   - file        : son system prompt (le fichier agents/*.md)
//   - contextFiles : les fichiers projet injectés automatiquement dans le prompt
//
// Sans contextFiles, l'agent répond dans le vide sans connaître le projet.

interface AgentConfig {
  file: string
  contextFiles: string[]
}

const AGENTS: Record<string, AgentConfig> = {
  orchestrator: {
    file: 'agents/ORCHESTRATOR.md',
    contextFiles: [
      'docs/GAME_CONTRACT.md',
      'docs/ARCHITECTURE.md',
      'docs/ROADMAP.md',
      'context/PRIMER.md',
    ],
  },
  'game-creator': {
    file: 'agents/GAME_CREATOR.md',
    contextFiles: [
      'docs/GAME_CONTRACT.md',
      'docs/ARCHITECTURE.md',
      'context/PRIMER.md',
    ],
  },
  debug: {
    file: 'agents/DEBUG.md',
    contextFiles: [
      'context/PRIMER.md',
      'claude.md',
    ],
  },
  enricher: {
    file: 'agents/CONTENT_ENRICHER.md',
    contextFiles: [
      'docs/GAME_CONTRACT.md',
    ],
  },
  session: {
    file: 'agents/SESSION_PRIMER.md',
    contextFiles: [
      'context/PRIMER.md',
      'context/HINDSIGHT.md',
    ],
  },
}

// ─── Types SSE ────────────────────────────────────────────────────────────────

interface ContentBlockDelta {
  type: 'content_block_delta'
  delta: {
    type: 'text_delta'
    text: string
  }
}

function isContentBlockDelta(value: unknown): value is ContentBlockDelta {
  if (typeof value !== 'object' || value === null) return false
  const obj = value as Record<string, unknown>
  if (obj['type'] !== 'content_block_delta') return false
  if (typeof obj['delta'] !== 'object' || obj['delta'] === null) return false
  const delta = obj['delta'] as Record<string, unknown>
  return delta['type'] === 'text_delta' && typeof delta['text'] === 'string'
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROOT = process.cwd()

function readFile(filePath: string): string | null {
  const fullPath = path.join(ROOT, filePath)
  if (!fs.existsSync(fullPath)) return null
  return fs.readFileSync(fullPath, 'utf-8')
}

function buildSystemPrompt(config: AgentConfig): string {
  const agentContent = readFile(config.file)
  if (!agentContent) {
    console.error(`❌ Fichier agent introuvable : ${config.file}`)
    process.exit(1)
  }

  const contextSections: string[] = []
  for (const contextFile of config.contextFiles) {
    const content = readFile(contextFile)
    if (content) {
      contextSections.push(`\n\n---\n## Contexte projet — ${contextFile}\n\n${content}`)
    }
  }

  return agentContent + contextSections.join('')
}

function printHelp(): void {
  console.log(`
Usage: npx tsx scripts/agent.ts <agent> "<message>"

Agents disponibles :
${Object.entries(AGENTS)
  .map(([name, config]) => `  ${name.padEnd(14)} → ${config.file}`)
  .join('\n')}

Exemples :
  npx tsx scripts/agent.ts orchestrator "J'ai une idée de jeu de logos"
  npx tsx scripts/agent.ts debug "Le scoreboard ne se met pas à jour"
  npx tsx scripts/agent.ts game-creator "Un jeu de devinettes musicales"
`)
}

// ─── Streaming ────────────────────────────────────────────────────────────────

async function streamResponse(systemPrompt: string, userMessage: string): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY manquante.')
    console.error('   → Ajoute-la dans .env.local ou lance : export ANTHROPIC_API_KEY=sk-ant-...')
    process.exit(1)
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error(`❌ Erreur API Anthropic (${response.status}) :`, error)
    process.exit(1)
  }

  if (!response.body) {
    console.error('❌ Pas de body dans la réponse API')
    process.exit(1)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })

    // Les événements SSE sont séparés par \n\n
    const events = buffer.split('\n\n')
    buffer = events.pop() ?? ''

    for (const event of events) {
      for (const line of event.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6)
        if (data === '[DONE]') continue

        try {
          const parsed: unknown = JSON.parse(data)
          if (isContentBlockDelta(parsed)) {
            process.stdout.write(parsed.delta.text)
          }
        } catch {
          // ignore les événements SSE malformés
        }
      }
    }
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const agentName = process.argv[2]
  const userMessage = process.argv[3]

  if (!agentName || agentName === '--help' || agentName === '-h') {
    printHelp()
    process.exit(0)
  }

  if (!userMessage) {
    console.error(`❌ Message manquant.\n   Usage : npx tsx scripts/agent.ts ${agentName} "<message>"`)
    process.exit(1)
  }

  const config = AGENTS[agentName]
  if (!config) {
    console.error(`❌ Agent "${agentName}" inconnu.`)
    console.error(`   Disponibles : ${Object.keys(AGENTS).join(', ')}`)
    process.exit(1)
  }

  const systemPrompt = buildSystemPrompt(config)

  const sep = '━'.repeat(52)
  console.log(`\n${sep}`)
  console.log(`🤖 Agent    : ${agentName}`)
  console.log(`📄 Contexte : ${config.contextFiles.join(', ')}`)
  console.log(`${sep}\n`)

  await streamResponse(systemPrompt, userMessage)

  console.log(`\n\n${sep}\n`)
}

main().catch((err: unknown) => {
  console.error('❌ Erreur inattendue :', err)
  process.exit(1)
})

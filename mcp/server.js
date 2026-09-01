#!/usr/bin/env node

/**
 * Model Context Protocol (MCP) Server for Modular Desktop App
 * Exposes tools for AI Agents to inspect, edit metadata dicts, reorder tracks, and process audio.
 */

const fs = require('fs')
const path = require('path')
const os = require('os')
const { spawn, execSync } = require('child_process')

// Locate default repo path
function getRepoPath() {
  return path.join(os.homedir(), 'Documents', 'MyRepo', 'Audio')
}

function getBeheraRepoPath() {
  return path.join(getRepoPath(), 'behera_repo.json')
}

function getAudioRepoPath() {
  return path.join(getRepoPath(), 'repo.json')
}

function readJsonFile(filePath, defaultValue = []) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    }
  } catch (e) {
    console.error(`Error reading ${filePath}:`, e)
  }
  return defaultValue
}

function writeJsonFile(filePath, data) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

// MCP Tools Definitions
const MCP_TOOLS = [
  {
    name: 'get_behera_tracks',
    description: "Get all arranged audio tracks from Behera Sir's Audio Repository, including their sequence order and metadata dictionaries.",
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Optional category filter (e.g. Lectures, Q&A, Bhagavad Gita)' }
      }
    }
  },
  {
    name: 'update_track_metadata',
    description: "Update the metadata dictionary and properties of a track in Behera Sir's Audio Repository. Agents can add or update key/value pairs in the metadata dict.",
    inputSchema: {
      type: 'object',
      properties: {
        track_id: { type: 'string', description: 'The unique ID of the track to update' },
        metadata_dict: {
          type: 'object',
          description: 'Key-value dictionary of metadata (e.g. { verse: "BG 2.13", date: "2026-08-28", notes: "...", keyPoints: ["Soul", "Duty"] })'
        },
        title: { type: 'string', description: 'Optional updated title' },
        speaker: { type: 'string', description: 'Optional updated speaker name' },
        topic: { type: 'string', description: 'Optional updated topic' },
        category: { type: 'string', description: 'Optional updated category' }
      },
      required: ['track_id', 'metadata_dict']
    }
  },
  {
    name: 'reorder_behera_tracks',
    description: "Reorder the sequence of tracks in Behera Sir's Audio Repository by providing an array of track IDs in the desired order.",
    inputSchema: {
      type: 'object',
      properties: {
        ordered_track_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of track IDs in the desired sequential playback order'
        }
      },
      required: ['ordered_track_ids']
    }
  },
  {
    name: 'add_behera_track',
    description: "Add a new audio track or lecture into Behera Sir's Repository with customizable metadata dictionary.",
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the lecture or audio' },
        speaker: { type: 'string', description: 'Speaker name (e.g. Dr. B. K. Behera)' },
        topic: { type: 'string', description: 'Topic or chapter subject' },
        category: { type: 'string', description: 'Category (Lectures, Philosophy, Q&A)' },
        file_path: { type: 'string', description: 'Absolute path to the audio file on disk' },
        metadata_dict: { type: 'object', description: 'Extensible metadata dictionary' }
      },
      required: ['title', 'file_path']
    }
  },
  {
    name: 'get_audio_repo_clips',
    description: 'List all downloaded and cropped audio clips from the main Audio Repository.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
]

// Tool Execution Handlers
function executeTool(name, args) {
  switch (name) {
    case 'get_behera_tracks': {
      const tracks = readJsonFile(getBeheraRepoPath())
      const filtered = args && args.category ? tracks.filter((t) => t.category === args.category) : tracks
      return {
        content: [{ type: 'text', text: JSON.stringify(filtered, null, 2) }]
      }
    }

    case 'update_track_metadata': {
      const tracks = readJsonFile(getBeheraRepoPath())
      const index = tracks.findIndex((t) => t.id === args.track_id)
      if (index === -1) {
        return { isError: true, content: [{ type: 'text', text: `Track with ID ${args.track_id} not found.` }] }
      }

      const current = tracks[index]
      const updated = {
        ...current,
        title: args.title || current.title,
        speaker: args.speaker || current.speaker,
        topic: args.topic || current.topic,
        category: args.category || current.category,
        metadata: {
          ...(current.metadata || {}),
          ...(args.metadata_dict || {})
        }
      }

      tracks[index] = updated
      writeJsonFile(getBeheraRepoPath(), tracks)
      return {
        content: [{ type: 'text', text: `Successfully updated metadata for "${updated.title}".\n\n${JSON.stringify(updated, null, 2)}` }]
      }
    }

    case 'reorder_behera_tracks': {
      const tracks = readJsonFile(getBeheraRepoPath())
      const map = new Map(tracks.map((t) => [t.id, t]))
      const reordered = []

      for (let i = 0; i < args.ordered_track_ids.length; i++) {
        const id = args.ordered_track_ids[i]
        const item = map.get(id)
        if (item) {
          item.order = i
          reordered.push(item)
          map.delete(id)
        }
      }

      map.forEach((item) => {
        item.order = reordered.length
        reordered.push(item)
      })

      writeJsonFile(getBeheraRepoPath(), reordered)
      return {
        content: [{ type: 'text', text: `Successfully reordered ${reordered.length} tracks.` }]
      }
    }

    case 'add_behera_track': {
      const tracks = readJsonFile(getBeheraRepoPath())
      const nextOrder = tracks.length > 0 ? Math.max(...tracks.map((t) => t.order || 0)) + 1 : 0
      const newTrack = {
        id: `behera_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        title: args.title,
        speaker: args.speaker || 'Dr. B. K. Behera',
        topic: args.topic || 'General',
        category: args.category || 'Lectures',
        filePath: args.file_path,
        fileName: path.basename(args.file_path),
        duration: 0,
        order: nextOrder,
        metadata: args.metadata_dict || { date: new Date().toISOString().split('T')[0] },
        createdAt: new Date().toISOString()
      }

      tracks.push(newTrack)
      writeJsonFile(getBeheraRepoPath(), tracks)
      return {
        content: [{ type: 'text', text: `Added new track "${newTrack.title}".\n\n${JSON.stringify(newTrack, null, 2)}` }]
      }
    }

    case 'get_audio_repo_clips': {
      const clips = readJsonFile(getAudioRepoPath())
      return {
        content: [{ type: 'text', text: JSON.stringify(clips, null, 2) }]
      }
    }

    default:
      return { isError: true, content: [{ type: 'text', text: `Unknown tool: ${name}` }] }
  }
}

// JSON-RPC STDIO Transport
let buffer = ''
process.stdin.setEncoding('utf-8')

process.stdin.on('data', (chunk) => {
  buffer += chunk
  const lines = buffer.split('\n')
  buffer = lines.pop()

  for (const line of lines) {
    if (!line.trim()) continue
    try {
      const request = JSON.parse(line)
      handleJsonRpc(request)
    } catch (e) {
      console.error('JSON parse error on stdin:', e)
    }
  }
})

function sendResponse(response) {
  process.stdout.write(JSON.stringify(response) + '\n')
}

function handleJsonRpc(req) {
  const { id, method, params } = req

  if (method === 'initialize') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: { tools: {} },
        serverInfo: { name: 'modular-desktop-audio-mcp', version: '1.0.0' }
      }
    })
  } else if (method === 'tools/list') {
    sendResponse({
      jsonrpc: '2.0',
      id,
      result: { tools: MCP_TOOLS }
    })
  } else if (method === 'tools/call') {
    const { name, arguments: args } = params || {}
    const result = executeTool(name, args)
    sendResponse({
      jsonrpc: '2.0',
      id,
      result
    })
  } else if (method === 'notifications/initialized') {
    // No response needed for notification
  } else {
    sendResponse({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `Method not found: ${method}` }
    })
  }
}

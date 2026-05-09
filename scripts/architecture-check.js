#!/usr/bin/env node

/**
 * V6 项目架构约束检查工具
 * 聚焦于模块引用规则和架构分层依赖
 * （any类型/console.log/文件大小/函数长度 由 code-quality-check.js 覆盖）
 */

const fs = require('fs')
const path = require('path')

const PROJECT_ROOT = path.resolve(__dirname, '..')
const FRONTEND_SRC = path.join(PROJECT_ROOT, 'apps', 'frontend', 'src')
const MODULES_DIR = path.join(FRONTEND_SRC, 'modules')

const violations = []

function findFiles(dir, exts) {
  const results = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '__tests__') {
      results.push(...findFiles(fullPath, exts))
    } else if (entry.isFile() && exts.some(ext => entry.name.endsWith(ext))) {
      results.push(fullPath)
    }
  }
  return results
}

function getModuleName(filePath) {
  const relative = path.relative(MODULES_DIR, filePath)
  const parts = relative.split(path.sep)
  return parts[0]
}

function checkModuleImportRules() {
  console.log('检查模块引用规则（禁止直接引用模块内部文件）...')

  const allFiles = [
    ...findFiles(FRONTEND_SRC, ['.ts', '.vue']),
  ]

  const moduleNames = fs.readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8')
    const lines = content.split('\n')
    const currentModule = getModuleName(file)

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      const importMatch = line.match(/from\s+['"](@\/modules\/([^'"]+))['"]/)
      if (!importMatch) continue

      const importPath = importMatch[2]

      for (const mod of moduleNames) {
        if (!importPath.startsWith(mod + '/')) continue

        const subPath = importPath.slice(mod.length + 1)

        if (subPath && subPath !== 'index' && subPath !== 'index.ts') {
          violations.push({
            file: path.relative(PROJECT_ROOT, file),
            line: i + 1,
            message: `禁止直接引用模块内部文件，请改为 from '@/modules/${mod}'`,
            code: line.trim(),
          })
        }
      }
    }
  }
}

function checkArchitectureLayers() {
  console.log('检查架构分层依赖（Types → Config → Repo → Service → Runtime → UI）...')

  const LAYERS = ['types', 'config', 'repo', 'service', 'runtime', 'ui']
  const LAYER_DIRS = ['types', 'config', 'repos', 'services', 'runtime', 'components']

  for (const moduleName of fs.readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name)) {

    const modulePath = path.join(MODULES_DIR, moduleName)

    for (let layerIdx = 0; layerIdx < LAYERS.length; layerIdx++) {
      const layerDir = path.join(modulePath, LAYER_DIRS[layerIdx])
      if (!fs.existsSync(layerDir)) continue

      const layerFiles = findFiles(layerDir, ['.ts', '.vue'])

      for (const file of layerFiles) {
        const content = fs.readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]

          for (let depIdx = layerIdx + 1; depIdx < LAYERS.length; depIdx++) {
            const forbiddenDir = LAYER_DIRS[depIdx]
            const pattern = new RegExp(`from\\s+['"].*\\/${forbiddenDir}\\/`)
            if (pattern.test(line)) {
              violations.push({
                file: path.relative(PROJECT_ROOT, file),
                line: i + 1,
                message: `${LAYERS[layerIdx]} 层禁止依赖 ${LAYERS[depIdx]} 层（${forbiddenDir}/）`,
                code: line.trim(),
              })
            }
          }
        }
      }
    }
  }
}

function main() {
  console.log('=== V6 架构约束检查 ===\n')

  if (!fs.existsSync(MODULES_DIR)) {
    console.log('modules 目录不存在，跳过检查')
    process.exit(0)
  }

  checkModuleImportRules()
  checkArchitectureLayers()

  if (violations.length > 0) {
    console.error(`\n发现 ${violations.length} 个架构违规：\n`)
    for (const v of violations) {
      console.error(`  ${v.file}:${v.line}`)
      console.error(`    ${v.message}`)
      console.error(`    ${v.code}\n`)
    }
    process.exit(1)
  }

  console.log('\n架构约束检查通过')
  process.exit(0)
}

main()

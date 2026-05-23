#!/usr/bin/env node

/**
 * V6项目代码质量检查工具
 * 基于V4教训，强制执行零容忍约束
 * 
 * 检查项目：
 * 1. 禁止any类型使用
 * 2. 禁止console.log遗留
 * 3. 文件大小限制
 * 4. 函数长度限制
 * 5. 业务逻辑正确性
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class CodeQualityChecker {
  constructor() {
    this.errors = []
    this.warnings = []
    this.projectRoot = path.resolve(__dirname, '..')
    this.frontendSrc = path.join(this.projectRoot, 'apps', 'frontend', 'src')
    this.backendSrc = path.join(this.projectRoot, 'apps', 'server', 'src')
  }

  /**
   * 检查TypeScript文件中的any类型使用
   */
  checkAnyTypeUsage() {
    console.log('🔍 检查any类型使用...')
    
    const tsFiles = this.findFiles(this.frontendSrc, '.ts')
    const vueFiles = this.findFiles(this.frontendSrc, '.vue')
    
    const allFiles = [...tsFiles, ...vueFiles]
    
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        if (line.includes(': any') || line.includes('any,') || line.includes('any)')) {
          // 排除注释中的any
          if (!line.trim().startsWith('//') && !line.includes('* any')) {
            this.errors.push({
              type: 'ERROR',
              file: path.relative(this.projectRoot, file),
              line: index + 1,
              message: '禁止使用any类型',
              code: line.trim()
            })
          }
        }
      })
    })
  }

  /**
   * 检查console.log等调试代码
   */
  checkConsoleUsage() {
    console.log('🔍 检查调试代码遗留...')
    
    const tsFiles = this.findFiles(this.frontendSrc, '.ts')
    const vueFiles = this.findFiles(this.frontendSrc, '.vue')
    
    const allFiles = [...tsFiles, ...vueFiles]
    
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        if (line.includes('console.') && 
            (line.includes('console.log') || 
             line.includes('console.error') || 
             line.includes('console.warn'))) {
          // 排除开发环境条件判断
          if (!line.includes('import.meta.env.DEV') && !line.includes('process.env.NODE_ENV')) {
            this.errors.push({
              type: 'ERROR',
              file: path.relative(this.projectRoot, file),
              line: index + 1,
              message: '禁止遗留console调试代码',
              code: line.trim()
            })
          }
        }
      })
    })
  }

  /**
   * 检查文件大小限制
   */
  checkFileSize() {
    console.log('🔍 检查文件大小限制...')
    
    const tsFiles = this.findFiles(this.frontendSrc, '.ts')
    const vueFiles = this.findFiles(this.frontendSrc, '.vue')
    
    const allFiles = [...tsFiles, ...vueFiles]
    
    allFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lineCount = content.split('\n').length
      const isTest = file.includes('__tests__')
      
      // 测试文件豁免行数限制
      if (isTest) return
      
      if (lineCount > 500) {
        this.errors.push({
          type: 'ERROR',
          file: path.relative(this.projectRoot, file),
          line: 'N/A',
          message: `文件超过500行硬限制 (当前: ${lineCount}行)`,
          code: ''
        })
      } else if (lineCount > 300) {
        this.warnings.push({
          type: 'WARNING',
          file: path.relative(this.projectRoot, file),
          line: 'N/A',
          message: `文件超过300行建议值 (当前: ${lineCount}行)`,
          code: ''
        })
      }
    })
  }

  /**
   * 检查函数长度限制
   */
  checkFunctionLength() {
    console.log('🔍 检查函数长度限制...')
    
    const tsFiles = this.findFiles(this.frontendSrc, '.ts')
    
    tsFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      const isTest = file.includes('__tests__')
      
      // 测试文件豁免函数长度限制
      if (isTest) return
      
      let inFunction = false
      let functionStart = 0
      let functionName = ''
      let braceCount = 0
      
      lines.forEach((line, index) => {
        // 检测函数开始
        if ((line.includes('function ') || line.includes('const ') && line.includes('= (')) && 
            !line.trim().startsWith('//')) {
          inFunction = true
          functionStart = index
          functionName = line.trim()
          braceCount = 0
        }
        
        if (inFunction) {
          // 统计大括号
          braceCount += (line.match(/\{/g) || []).length
          braceCount -= (line.match(/\}/g) || []).length
          
          // 函数结束
          if (braceCount === 0 && functionStart > 0) {
            const functionLength = index - functionStart + 1
            
            if (functionLength > 80) {
              this.errors.push({
                type: 'ERROR',
                file: path.relative(this.projectRoot, file),
                line: functionStart + 1,
                message: `函数超过80行硬限制 (当前: ${functionLength}行)`,
                code: functionName
              })
            } else if (functionLength > 50) {
              this.warnings.push({
                type: 'WARNING',
                file: path.relative(this.projectRoot, file),
                line: functionStart + 1,
                message: `函数超过50行建议值 (当前: ${functionLength}行)`,
                code: functionName
              })
            }
            
            inFunction = false
            functionStart = 0
            functionName = ''
          }
        }
      })
    })
  }

  /**
   * 检查业务逻辑问题
   */
  checkBusinessLogic() {
    console.log('🔍 检查业务逻辑问题...')
    
    const vueFiles = this.findFiles(this.frontendSrc, '.vue')
    
    vueFiles.forEach(file => {
      const content = fs.readFileSync(file, 'utf8')
      const lines = content.split('\n')
      
      lines.forEach((line, index) => {
        // 检查computed中的副作用
        if (line.includes('computed') && line.includes('Math.random')) {
          this.errors.push({
            type: 'ERROR',
            file: path.relative(this.projectRoot, file),
            line: index + 1,
            message: 'computed中禁止使用Math.random等副作用操作',
            code: line.trim()
          })
        }
        
        // 检查硬编码的敏感信息
        if (line.includes('password') || line.includes('secret') || line.includes('key')) {
          if (line.includes('=') && !line.includes('process.env') && !line.includes('import.meta.env')) {
            this.warnings.push({
              type: 'WARNING',
              file: path.relative(this.projectRoot, file),
              line: index + 1,
              message: '疑似硬编码敏感信息',
              code: line.trim()
            })
          }
        }
      })
    })
  }

  /**
   * 运行TypeScript类型检查
   */
  runTypeCheck() {
    console.log('🔍 运行TypeScript类型检查...')
    
    try {
      const result = execSync('npx tsc --noEmit', {
        cwd: path.join(this.projectRoot, 'apps', 'frontend'),
        encoding: 'utf8'
      })
      
      if (result) {
        this.errors.push({
          type: 'ERROR',
          file: 'TypeScript编译',
          line: 'N/A',
          message: 'TypeScript类型检查失败',
          code: result
        })
      }
    } catch (error) {
      this.errors.push({
        type: 'ERROR',
        file: 'TypeScript编译',
        line: 'N/A',
        message: 'TypeScript类型检查失败',
        code: error.stdout || error.message
      })
    }
  }

  /**
   * 查找指定扩展名的文件
   */
  findFiles(dir, extension) {
    if (!fs.existsSync(dir)) {
      return []
    }
    
    let results = []
    const list = fs.readdirSync(dir)
    
    list.forEach(file => {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat && stat.isDirectory()) {
        results = results.concat(this.findFiles(filePath, extension))
      } else if (file.endsWith(extension)) {
        results.push(filePath)
      }
    })
    
    return results
  }

  /**
   * 运行所有检查
   */
  runAllChecks() {
    console.log('🚀 开始V6项目代码质量检查...\n')
    
    this.checkAnyTypeUsage()
    this.checkConsoleUsage()
    this.checkFileSize()
    this.checkFunctionLength()
    this.checkBusinessLogic()
    this.runTypeCheck()
    
    console.log('\n' + '='.repeat(80))
    console.log('📊 检查结果汇总')
    console.log('='.repeat(80))
    
    if (this.errors.length > 0) {
      console.log('❌ 发现错误:')
      this.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.type}: ${error.file}:${error.line}`)
        console.log(`   消息: ${error.message}`)
        if (error.code) {
          console.log(`   代码: ${error.code}`)
        }
      })
    } else {
      console.log('✅ 未发现错误')
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  发现警告:')
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.type}: ${warning.file}:${warning.line}`)
        console.log(`   消息: ${warning.message}`)
        if (warning.code) {
          console.log(`   代码: ${warning.code}`)
        }
      })
    }
    
    console.log('\n' + '='.repeat(80))
    console.log(`📈 统计信息:`)
    console.log(`   错误数量: ${this.errors.length}`)
    console.log(`   警告数量: ${this.warnings.length}`)
    console.log('='.repeat(80))
    
    return {
      errors: this.errors,
      warnings: this.warnings,
      passed: this.errors.length === 0
    }
  }
}

// 命令行接口
if (require.main === module) {
  const checker = new CodeQualityChecker()
  const result = checker.runAllChecks()
  
  if (!result.passed) {
    console.log('\n❌ 代码质量检查失败，请修复上述问题后再提交')
    process.exit(1)
  } else {
    console.log('\n✅ 代码质量检查通过')
    process.exit(0)
  }
}

module.exports = CodeQualityChecker
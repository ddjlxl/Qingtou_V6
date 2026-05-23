#!/usr/bin/env node

/**
 * V6项目开发前检查清单
 * 强制AI在每次开发前执行，确保理解需求和约束
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

class PreDevelopmentChecklist {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..')
    this.docsDir = path.join(this.projectRoot, 'docs')
    this.rulesDir = path.join(this.projectRoot, '.trae', 'rules')
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
  }

  /**
   * 检查文档是否已阅读
   */
  async checkDocumentation() {
    console.log('📚 文档检查')
    console.log('='.repeat(50))
    
    const requiredDocs = [
      { name: 'V6需求文档.md', path: path.join(this.docsDir, 'V6需求文档.md') },
      { name: 'V6数据库设计.md', path: path.join(this.docsDir, 'V6数据库设计.md') },
      { name: 'V6开发规则.md', path: path.join(this.docsDir, 'V6开发规则.md') },
      { name: 'AI约束机制.md', path: path.join(this.rulesDir, 'ai-constraints.md') }
    ]
    
    for (const doc of requiredDocs) {
      if (!fs.existsSync(doc.path)) {
        console.log(`❌ 文档不存在: ${doc.name}`)
        return false
      }
      
      const content = fs.readFileSync(doc.path, 'utf8')
      const lines = content.split('\n').length
      
      console.log(`✅ ${doc.name} (${lines}行)`)
      
      // 随机提问验证理解
      const question = this.generateQuestion(doc.name, content)
      if (question) {
        const answer = await this.askQuestion(question)
        if (!answer) {
          console.log(`❌ 对${doc.name}的理解不足`)
          return false
        }
      }
    }
    
    return true
  }

  /**
   * 生成随机问题验证理解
   */
  generateQuestion(docName, content) {
    if (docName === 'V6需求文档.md') {
      const questions = [
        "任务状态流转规则是什么？（用一句话描述）",
        "系统有哪些用户角色？",
        "订单分配的基本规则是什么？"
      ]
      return questions[Math.floor(Math.random() * questions.length)]
    }
    
    if (docName === 'V6数据库设计.md') {
      const questions = [
        "用户表的主键是什么类型？",
        "订单表有哪些状态字段？",
        "车辆表如何关联司机信息？"
      ]
      return questions[Math.floor(Math.random() * questions.length)]
    }
    
    if (docName === 'V6开发规则.md') {
      const questions = [
        "TypeScript中禁止使用什么类型？",
        "单个文件最多允许多少行？",
        "Store中禁止混入什么？"
      ]
      return questions[Math.floor(Math.random() * questions.length)]
    }
    
    if (docName === 'AI约束机制.md') {
      const questions = [
        "违反约束的处理措施是什么？",
        "开发前必须检查哪些内容？",
        "零容忍约束有哪些？"
      ]
      return questions[Math.floor(Math.random() * questions.length)]
    }
    
    return null
  }

  /**
   * 提问并获取答案
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(`\n❓ 问题: ${question}\n   回答: `, (answer) => {
        resolve(answer.trim().length > 0)
      })
    })
  }

  /**
   * 检查技术约束理解
   */
  async checkTechnicalConstraints() {
    console.log('\n🔧 技术约束检查')
    console.log('='.repeat(50))
    
    const constraints = [
      {
        question: "TypeScript中禁止使用什么类型？替代方案是什么？",
        expected: "禁止使用any类型，替代方案是使用具体类型或unknown+类型守卫"
      },
      {
        question: "如何避免console.log遗留到生产环境？",
        expected: "使用日志系统或条件编译，如import.meta.env.DEV"
      },
      {
        question: "文件大小和函数长度的限制是多少？",
        expected: "单个文件不超过300行(warn)/500行(error)，单个函数不超过50行(warn)/80行(error)"
      },
      {
        question: "Store中禁止混入什么？如何解决？",
        expected: "禁止混入Mock数据和API逻辑，应环境分离"
      }
    ]
    
    for (const constraint of constraints) {
      const answer = await this.askQuestion(constraint.question)
      if (!answer) {
        console.log(`❌ 技术约束理解不足: ${constraint.question}`)
        return false
      }
    }
    
    return true
  }

  /**
   * 检查业务规则理解
   */
  async checkBusinessRules() {
    console.log('\n📋 业务规则检查')
    console.log('='.repeat(50))
    
    const rules = [
      {
        question: "任务状态的流转规则是什么？",
        expected: "待分配→已分配→运输中→已完成，只能向前不能后退"
      },
      {
        question: "订单分配的基本规则是什么？",
        expected: "空闲车辆优先，就近原则，考虑车辆类型匹配"
      },
      {
        question: "异常处理的基本流程是什么？",
        expected: "任何状态都可标记异常，需填写异常原因"
      }
    ]
    
    for (const rule of rules) {
      const answer = await this.askQuestion(rule.question)
      if (!answer) {
        console.log(`❌ 业务规则理解不足: ${rule.question}`)
        return false
      }
    }
    
    return true
  }

  /**
   * 生成开发计划确认
   */
  async confirmDevelopmentPlan() {
    console.log('\n📝 开发计划确认')
    console.log('='.repeat(50))
    
    const planQuestions = [
      "请简要描述你要开发的功能",
      "涉及哪些数据表和字段？",
      "需要修改哪些现有文件？",
      "预计会产生哪些新的文件？"
    ]
    
    for (const question of planQuestions) {
      const answer = await this.askQuestion(question)
      if (!answer) {
        console.log(`❌ 开发计划不明确: ${question}`)
        return false
      }
    }
    
    return true
  }

  /**
   * 运行完整检查
   */
  async runFullCheck() {
    console.log('🚀 V6项目开发前检查清单')
    console.log('='.repeat(50))
    
    const checks = [
      { name: '文档检查', method: () => this.checkDocumentation() },
      { name: '技术约束检查', method: () => this.checkTechnicalConstraints() },
      { name: '业务规则检查', method: () => this.checkBusinessRules() },
      { name: '开发计划确认', method: () => this.confirmDevelopmentPlan() }
    ]
    
    let allPassed = true
    
    for (const check of checks) {
      console.log(`\n📋 ${check.name}`)
      const passed = await check.method()
      
      if (!passed) {
        console.log(`❌ ${check.name} 失败`)
        allPassed = false
        break
      } else {
        console.log(`✅ ${check.name} 通过`)
      }
    }
    
    this.rl.close()
    
    if (allPassed) {
      console.log('\n🎉 所有检查通过，可以开始开发！')
      console.log('\n📋 开发前提醒:')
      console.log('   1. 严格遵守零容忍约束')
      console.log('   2. 遇到问题立即停止并报告')
      console.log('   3. 完成开发后运行代码质量检查')
      return true
    } else {
      console.log('\n❌ 检查失败，请重新阅读相关文档后再开始开发')
      return false
    }
  }
}

// 命令行接口
if (require.main === module) {
  const checklist = new PreDevelopmentChecklist()
  
  checklist.runFullCheck().then(passed => {
    process.exit(passed ? 0 : 1)
  }).catch(error => {
    console.error('检查过程中出错:', error)
    process.exit(1)
  })
}

module.exports = PreDevelopmentChecklist
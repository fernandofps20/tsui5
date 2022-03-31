import { GluegunToolbox } from 'gluegun'

type TemplateProps = {
  application: string
  namespace: string
  framework: string
  frameworkVersion: string
  author: string
  tstypes: string
  tstypesVersion: string
  appId: string
  appURI: string
  setupCompleted: boolean
}

module.exports = {
  name: 'create',
  description: 'Creates a new ui5 typescript project',
  run: async (toolbox: GluegunToolbox) => {
    const {
      parameters,
      filesystem,
      //system,
      template: { generate },
      print: { error, info, colors },
      prompt,
    } = toolbox

    const props: TemplateProps = {
      application: parameters.first,
      namespace: undefined,
      framework: 'OpenUI5',
      frameworkVersion: '1.100.0',
      author: undefined,
      tstypes: '@openui5/ts-types-esm',
      tstypesVersion: '1.100.0',
      appId: undefined,
      appURI: undefined,
      setupCompleted: undefined,
    }

    // Check project name
    if (!props.application || props.application.length === 0) {
      error('You must provide a valid project name.')
      return undefined
    } else if (!/^[a-z0-9-]+$/.test(props.application)) {
      error(
        `${props.application} is not a valid name. Use lower-case and dashes only.`
      )
      return undefined
    }

    if (filesystem.exists(props.application)) {
      info(``)
      error(`There's already a folder named ${props.application} here.`)
      return undefined
    }

    info(``)
    const answer = await prompt.ask([
      {
        type: 'input',
        name: 'namespace',
        message: 'Which namespace do you want to use?',
        validate: (s) => {
          if (/^[a-zA-Z0-9_.]*$/g.test(s)) {
            return true
          }
          return 'Please use alpha numeric characters and dots only for the namespace.'
        },
      },
      {
        type: 'input',
        name: 'author',
        message: 'Who is the author of the application?',
        validate: (s) => {
          if (/^[a-zA-Z0-9]*$/g.test(s)) {
            return true
          }
          return 'Author not valid'
        },
      },
    ])

    props.namespace = answer.namespace
    props.author = answer.author
    props.appId = `${props.namespace}.${props.application}`
    props.appURI = `${props.namespace.replace('.', '/')}/${props.application}`

    // create the directory
    filesystem.dir(props.application)

    // active generators, for parallel generation
    let active = []

    // all the template files we'll use to generate the project
    const files = [
      'src/manifest.json.ejs',
      'src/index.html.ejs',
      'src/Component.ts.ejs',
      'src/view/App.view.xml.ejs',
      'src/view/Main.view.xml.ejs',
      'src/service/AppService.ts.ejs',
      'src/service/CoreService.ts.ejs',
      'src/model/Formatter.ts.ejs',
      'src/model/models.ts.ejs',
      'src/i18n/i18n.properties.ejs',
      'src/css/style.css.ejs',
      'src/controller/App.controller.ts.ejs',
      'src/controller/Main.controller.ts.ejs',
      'src/controller/BaseController.ts.ejs',
      '.babelrc.json.ejs',
      '.eslintrc.json.ejs',
      '.gitignore.ejs',
      'LICENSE.ejs',
      'package.json.ejs',
      'README.md.ejs',
      'tsconfig.json.ejs',
      'ui5-dist.yaml.ejs',
      'ui5.yaml.ejs',
    ]

    active = files.reduce((prev, file) => {
      const template = `project/${file}`

      const target = `${props.application}/` + file.replace('.ejs', '')
      info(`${colors.green(`CREATED`)} ${target}`)
      return prev.concat([generate({ template, target, props })])
    }, active)

    // let all generator calls run in parallel
    await Promise.all(active)
    filesystem.write(`${props.application}/tsui5.json`, props)
    info(`${colors.blue(`FORCE`)} ${props.application}/tsui5.json`)

    // install with yarn or npm i
    /*const yarnOrNpm = system.which('yarn') ? 'yarn' : 'npm'
    await system.spawn(`cd ${props.application} && ${yarnOrNpm} install`, {
      shell: true,
      stdio: 'inherit',
    })*/

    info(`Project ${props.application} generated succesfuly!`)
  },
}

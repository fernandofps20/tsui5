import { GluegunToolbox } from 'gluegun'

type GeneratorOptions = {
  name: string
  generator: string
  appId: string
}

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
  name: string
}

module.exports = {
  name: 'generate',
  alias: ['g'],
  run: async (toolbox: GluegunToolbox) => {
    const {
      parameters,
      filesystem,
      //strings: { pascalCase, kebabCase, camelCase },
      template: { generate },
      print: { error, info, colors },
    } = toolbox 

    if (!filesystem.exists('tsui5.json')) {
      error(`There's no tsui5 project in this folder`)
      return
    }

    const props: TemplateProps = JSON.parse(filesystem.read('tsui5.json'))
    const options: GeneratorOptions = {
      name: parameters.second,
      generator: parameters.first,
      appId: props.appId,
    }

    if (!availableGenerators().includes(options.generator)) {
      error(`Generator "${options.generator}" doesn't exist`)
      return
    }

    // Check project name
    if (!options.name || options.name.length === 0) {
      error(
        `Please specify a name for your ${options.generator}: tsui5 g ${options.generator} my${options.generator}`
      )
      return
    } else if (!/^[a-z0-9-]+$/.test(options.name)) {
      error(
        `${options.name} is not a valid name. Use lower-case and dashes only.`
      )
      return
    }

    generateFromTemplate(options)

    function generateFromTemplate(options: GeneratorOptions) {
      const templateDir = filesystem.path(sourceDirectory(), options.generator)
      const files = filesystem.find(templateDir, { matching: '*' })
      generateFiles(files, options)
    }
    async function generateFiles(files: any, options: GeneratorOptions) {
      const { separator } = filesystem
      let active = []

      active = files.reduce((prev, file) => {
        const template = file
          .substring(`..\\tsui5\\src\\templates\\${options.generator}\\`.length)
          .replaceAll('\\', '/')
        const templateName = file.split(separator).slice(-1)[0]
        const filename = file
          .split(separator)
          .slice(-1)[0]
          .replace('NAME', options.name)
          .replace('.ejs', '')
        const target = `src/${template.replace(templateName, filename)}`
        info(`${colors.green(`CREATED`)} ${target}`)
        return prev.concat([
          generate({
            template: `${options.generator}/${template}`,
            target,
            props: options,
          }),
        ])
      }, active)

      await Promise.all(active)
      updateManifest()
    }

    function updateManifest() {
      const manifest = JSON.parse(filesystem.read('src/manifest.json'))
      if (options.generator == 'view') {
        const targetName = `Target${options.name}`
        const routeName = `Route${options.name}`
        manifest['sap.ui5'].routing = manifest['sap.ui5'].routing || {}
        manifest['sap.ui5'].routing.routes =
          manifest['sap.ui5'].routing.routes || []
        manifest['sap.ui5'].routing.targets =
          manifest['sap.ui5'].routing.targets || {}

        manifest['sap.ui5'].routing.routes.push({
          name: options.name,
          pattern: routeName,
          target: [targetName],
        })
        manifest['sap.ui5'].routing.targets[targetName] = {
          viewType: 'XML',
          viewId: options.name.toLowerCase(),
          viewName: options.name,
        }
        filesystem.write('src/manifest.json', manifest)
        info(`${colors.blue(`FORCE`)} manifest.json`)
      }
    }
    function sourceDirectory(): string {
      return filesystem.path(__filename, '..', '..', '..', 'src', 'templates')
    }
    function availableGenerators(): string[] {
      const { subdirectories, separator } = filesystem
      return subdirectories(sourceDirectory()).map(
        (g) => g.split(separator).slice(-1)[0]
      )
    }
  }
}
import * as FS from 'fs';
import * as Path from 'path';
import * as Util from 'util';

import { Application } from '../application';
import { AbstractComponent, Component, Option } from './component';
import { ParameterType } from './options/declaration';

@Component({name: 'plugin-host', internal: true})
export class PluginHost extends AbstractComponent<Application> {
    @Option({
        name: 'plugin',
        help: 'Specify the npm plugins that should be loaded. Omit to load all installed plugins, set to \'none\' to load no plugins.',
        type: ParameterType.String,
        isArray: true
    })
    plugins: string[];

    /**
     * Load the given list of npm plugins.
     *
     * @param plugins  A list of npm modules that should be loaded as plugins. When not specified
     *   this function will invoke [[discoverNpmPlugins]] to find a list of all installed plugins.
     * @returns TRUE on success, otherwise FALSE.
     */
    load(): boolean {
        const logger = this.application.logger;
        const plugins = this.plugins || this.discoverNpmPlugins();

        let i: number, c: number = plugins.length;
        for (i = 0; i < c; i++) {
            const plugin = plugins[i];
            if (typeof plugin !== 'string') {
                logger.error('Unknown plugin %s', plugin);
                return false;
            } else if (plugin.toLowerCase() === 'none') {
                return true;
            }
        }

        for (i = 0; i < c; i++) {
            const plugin = plugins[i];
            try {
                const instance = require(plugin);
                const initFunction = typeof instance.load === 'function'
                  ? instance.load
                  : instance                // support legacy plugins
                ;
                if (typeof initFunction === 'function') {
                    instance(this);
                    logger.write('Loaded plugin %s', plugin);
                } else {
                    logger.error('Invalid structure in plugin %s, no function found.', plugin);
                }
            } catch (error) {
                logger.error('The plugin %s could not be loaded.', plugin);
                logger.writeln(error.stack);
            }
        }
    }

    /**
     * Discover all installed TypeDoc plugins.
     *
     * @returns A list of all npm module names that are qualified TypeDoc plugins.
     */
    private discoverNpmPlugins(): string[] {
        const result: string[] = [];
        const logger = this.application.logger;
        discover();
        return result;

        /**
         * Find all parent folders containing a `node_modules` subdirectory.
         */
        function discover() {
            let path = process.cwd(), previous: string;
            do {
                const modules = Path.join(path, 'node_modules');
                if (FS.existsSync(modules) && FS.lstatSync(modules).isDirectory()) {
                    discoverModules(modules);
                }

                previous = path;
                path = Path.resolve(Path.join(previous, '..'));
            } while (previous !== path);
        }

        /**
         * Scan the given `node_modules` directory for TypeDoc plugins.
         */
        function discoverModules(basePath: string) {
            FS.readdirSync(basePath).forEach((name) => {
                const dir = Path.join(basePath, name);
                const infoFile = Path.join(dir, 'package.json');
                if (!FS.existsSync(infoFile)) {
                    return;
                }

                const info = loadPackageInfo(infoFile);
                if (isPlugin(info)) {
                    result.push(name);
                }
            });
        }

        /**
         * Load and parse the given `package.json`.
         */
        function loadPackageInfo(fileName: string): any {
            try {
                return JSON.parse(FS.readFileSync(fileName, {encoding: 'utf-8'}));
            } catch (error) {
                logger.error('Could not parse %s', fileName);
                return {};
            }
        }

        /**
         * Test whether the given package info describes a TypeDoc plugin.
         */
        function isPlugin(info: any): boolean {
            const keywords: string[] = info.keywords;
            if (!keywords || !Util.isArray(keywords)) {
                return false;
            }

            for (let i = 0, c = keywords.length; i < c; i++) {
                const keyword = keywords[i];
                if (typeof keyword === 'string' && keyword.toLowerCase() === 'typedocplugin') {
                    return true;
                }
            }

            return false;
        }
    }
}

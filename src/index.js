"use strict";
const chalk = require('./template');
const template = require('./template');
const markdown = require('./markdown');
const aggregate = require('./aggregate');
const configs = require('./configs');
const glob = require('glob');
const path = require('path');
const fse = require('fs-extra');

let procs = {};

module.exports = {
    templateString: template.string,
    templateFile: template.file,
    template: template.run,
    markdown: markdown.run,
    registerHelper: template.registerHelper,
    registerParser: aggregate.registerParser,
    registerProcessor: registerProc,
    run: function (config) {
        configs.parseOrSet(config);
        return new Promise((resolve, reject) => {
            glob('**', {
                nodir: true,
                ignore: ['node_modules/**', configs.args.outputDir + '/**', '_*/**']
            }, (err, files) => {
                if (err) {
                    reject(err);
                }
                return Promise.all(files.map(file => findProc(file)(file)));
            });
        }).catch(err => console.log(chalk.red(err)));
    }
};

registerProc('\.md$', (file) => {
    markdown.run(file, configs.args.outputDir);
});

registerProc('\.html$', (file) => {
    template.file(file, configs.args, configs.args.outputDir);
});

function registerProc(name, proc) {
    procs[name] = proc;
}

function findProc(file) {
    for (let pat in procs) {
        if (file.match(pat)) {
            return procs[pat];
        }
    }
    return (file) => new Promise((resolve, reject) => {
        fse.copy(file, path.resolve(configs.args.outputDir, file), (err) => {
            if (err) reject(err); else resolve();
        });
    });
}

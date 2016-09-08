'use strict';

const coreType = require('./core.type');

module.exports = {
    literalOut: (root, instance, ast) => {
        return ast.type;
    },
    literalIn: (root, instance, ast, type) => {
        throw 1;
    },

    symbolOut: (root, instance, ast) => {
        throw 1;
    },
    symbolIn: (root, instance, ast, type) => {
        instance.add(ast.name, ast.mode, type);
    },

    lookup: (root, instance, ast) => {
        let result;

        switch (ast.mode) {
        case 'global': {
            result = root.types[ast.name];

            break;
        }
        case 'mixed': {
            let target = instance;

            while (!result && target) {
                result = target.types[ast.name];
                target = target.types['__parent'];
            }

            break;
        }
        case 'local': {
            result = instance.types[ast.name];

            break;
        }
        default: {
            throw 1; // never reach
        }
        }

        if (!result) {
            throw 1;
        }

        return result;
    },
    lookupOut: (root, instance, ast) => {
        return module.exports.lookup(
            root, instance, ast
        );
    },
    lookupIn: (root, instance, ast, type) => {
        if (
            module.exports.lookup(
                root, instance, ast
            ).name !== type.name // TODO: type checking
        ) {
            throw 1;
        }
    },

    pathOut: (root, instance, ast) => {
        return module.exports.visitOut(
            root, instance, ast.source
        ).types[ast.name];
    },
    pathIn: (root, instance, ast, type) => {
        if (
            module.exports.visitOut(
                root, instance, ast.source
            ).types[ast.name].name !== type.name // TODO: type checking
        ) {
            throw 1;
        }
    },

    call: (instance, ast, before, after) => {
        const callee = module.exports.visitOut(
            root, instance, ast.callee
        );
        const closure = module.exports.visitOut(
            root, instance, ast.closure
        );
        // TODO
    },
    callOut: (root, instance, ast) => {
        // TODO
    },
    callIn: (root, instance, ast, type) => {
        // TODO
    },

    codeOut: (root, instance, ast) => {
        return ast;
    },
    codeIn: (root, instance, ast, type) => {
        throw 1;
    },

    visitOut: (root, instance, ast) => {
        return module.exports[ast.__type + 'Out'](
            root, instance, ast
        );
    },
    visitIn: (root, instance, ast, type) => {
        module.exports[ast.__type + 'In'](
            root, instance, ast, type
        );
    },
};
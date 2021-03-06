'use strict';

module.exports = () => {
    const pass = {
        code: [],
        buffer: [],

        write: (line) => {
            pass.buffer.back().push(line + ';\n');
        },

        literal: (ast, target) => {
            switch (ast.type) {
                case 'void': {
                    pass.write(target('undefined'));

                    break;
                }
                case 'boolean':
                case 'i8':
                case 'i16':
                case 'i32':
                case 'u8':
                case 'u16':
                case 'u32':
                case 'f32':
                case 'f64': {
                    pass.write(target(ast.value.toString()));

                    break;
                }
                case 'string': {
                    pass.write(target(JSON.stringify(ast.value)));

                    break;
                }
                case 'i64':
                case 'u64': {
                    throw 1;
                }
                default: {
                    throw 1; // never reach
                }
            }
        },

        self: (ast, target) => {
            pass.write(target('self'));
        },

        root: (ast, target) => {
            pass.write(target('root'));
        },

        pathOut: (ast, target) => {
            pass.visitOut(
                ast.upper,
                (value) => {
                    return 'upper = ' + value;
                }
            );

            pass.write(target('upper.get(' + JSON.stringify(ast.name) + ')'));
        },

        pathIn: (ast, value) => {
            pass.visitOut(
                ast.upper,
                (value) => {
                    return 'upper = ' + value;
                }
            );

            pass.write('upper.set(' + JSON.stringify(ast.name) + ', ' + value + ')');
        },

        call: (ast, before, after, builder) => {
            pass.visitOut(
                ast.callee,
                (value) => {
                    return 'callee = ' + value;
                }
            );

            const calleeId = pass.build(ast.instance, builder);

            pass.write('inner = new Map()');
            pass.write('inner.set(\'__func\', ' + calleeId + ')');

            const returnId = calleeId + '_' + pass.buffer.length;

            pass.write('inner.set(\'__outer\', callee)');
            pass.write('callee = inner');

            before();

            for (const i in ast.outArgs) {
                pass.visitOut(
                    ast.callee,
                    (value) => {
                        return 'callee.set(' + JSON.stringify(i) + ', ' + value + ')';
                    }
                );
            }

            pass.write('callee.set(\'__caller\', self)');
            pass.write('self = callee');

            // call
            pass.write('func = callee.get(\'__func\')');
            pass.write('callee.set(\'__func\', ' + returnId + ')');
            pass.write('func()');

            pass.write('}');
            pass.write('');
            pass.write('const ' + returnId + ' = () => {');

            pass.write('callee = self');
            pass.write('self = callee.get(\'__caller\')');

            for (const i in ast.inArgs) {
                pass.visitIn(
                    ast.callee,
                    'callee.get(' + JSON.stringify(i) + ')'
                );
            }

            after();

            pass.write('inner = callee');
            pass.write('callee = inner.get(\'__outer\')');
        },

        callOut: (ast, target) => {
            pass.call(
                ast,
                () => {
                    // nothing
                },
                () => {
                    pass.write(target('callee.get(\'__result\')'));
                },
                (ast) => {
                    pass.visitOut(
                        ast,
                        (value) => {
                            return 'self.set(\'__result\', ' + value + ')';
                        }
                    );
                }
            );
        },

        callIn: (ast, value) => {
            pass.call(
                ast,
                () => {
                    pass.write('callee.set(\'__input\', ' + value + ')');
                },
                () => {
                    // nothing
                },
                (ast) => {
                    pass.visitIn(
                        ast,
                        'self.get(\'__input\')'
                    );
                }
            );
        },

        visitOut: (ast, target) => {
            // TODO: check ast.__type
            pass[ast.__type](
                ast,
                target
            );
        },

        visitIn: (ast, value) => {
            // TODO: check ast.__type
            pass[ast.__type](
                ast,
                value
            );
        },

        build: (instance, builder) => {
            // TODO: remove duplicated

            const id = 'func_' + pass.code.length;

            pass.buffer.push([]);

            pass.write('const ' + id + ' = () => {');

            builder(instance.impl2);

            pass.write('}');
            pass.write('');

            pass.code.push(pass.buffer.pop());

            return id;
        },
    };

    return pass;
};

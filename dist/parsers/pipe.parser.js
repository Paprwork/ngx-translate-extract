Object.defineProperty(exports, "__esModule", { value: true });
exports.PipeParser = void 0;
const compiler_1 = require("@angular/compiler");
const translation_collection_1 = require("../utils/translation.collection");
const utils_1 = require("../utils/utils");
const TRANSLATE_PIPE_NAME = 'translate';
class PipeParser {
    extract(source, filePath) {
        if (filePath && utils_1.isPathAngularComponent(filePath)) {
            source = utils_1.extractComponentInlineTemplate(source);
        }
        let collection = new translation_collection_1.TranslationCollection();
        const nodes = this.parseTemplate(source, filePath);
        const pipes = nodes.map((node) => this.findPipesInNode(node)).flat();
        pipes.forEach((pipe) => {
            this.parseTranslationKeysFromPipe(pipe).forEach((key) => {
                collection = collection.add(key.value, key.default);
            });
        });
        return collection;
    }
    findPipesInNode(node) {
        var _a;
        let ret = [];
        if (node === null || node === void 0 ? void 0 : node.children) {
            ret = node.children.reduce((result, childNode) => {
                const children = this.findPipesInNode(childNode);
                return result.concat(children);
            }, [ret]);
        }
        if ((_a = node === null || node === void 0 ? void 0 : node.value) === null || _a === void 0 ? void 0 : _a.ast) {
            ret.push(...this.getTranslatablesFromAst(node.value.ast));
        }
        if (node === null || node === void 0 ? void 0 : node.attributes) {
            const translateableAttributes = node.attributes.filter((attr) => {
                return attr.name === TRANSLATE_PIPE_NAME;
            });
            ret = [...ret, ...translateableAttributes];
        }
        if (node === null || node === void 0 ? void 0 : node.inputs) {
            node.inputs.forEach((input) => {
                var _a;
                if ((_a = input === null || input === void 0 ? void 0 : input.value) === null || _a === void 0 ? void 0 : _a.ast) {
                    ret.push(...this.getTranslatablesFromAst(input.value.ast));
                }
            });
        }
        return ret;
    }
    parseTranslationKeysFromPipe(pipeContent) {
        const ret = [];
        if (pipeContent instanceof compiler_1.LiteralPrimitive) {
            ret.push(pipeContent.value);
        }
        else if (pipeContent instanceof compiler_1.Conditional) {
            const trueExp = pipeContent.trueExp;
            ret.push(...this.parseTranslationKeysFromPipe(trueExp));
            const falseExp = pipeContent.falseExp;
            ret.push(...this.parseTranslationKeysFromPipe(falseExp));
        }
        else if (pipeContent instanceof compiler_1.BindingPipe) {
            console.log('--------------');
            if (pipeContent.args[0]) {
                const index = pipeContent.args[0].keys.findIndex((item) => item.key === 'default');
                if (index > -1) {
                    const value = pipeContent.exp;
                    value['default'] = pipeContent.args[0].values[index].value;
                    ret.push(value);
                }
                else {
                    ret.push(...this.parseTranslationKeysFromPipe(pipeContent.exp));
                }
            }
            else {
                ret.push(...this.parseTranslationKeysFromPipe(pipeContent.exp));
            }
        }
        return ret;
    }
    getTranslatablesFromAst(ast) {
        if (this.expressionIsOrHasBindingPipe(ast)) {
            return [ast];
        }
        if (ast instanceof compiler_1.Interpolation) {
            return this.getTranslatablesFromAsts(ast.expressions);
        }
        if (ast instanceof compiler_1.Conditional) {
            return this.getTranslatablesFromAsts([ast.trueExp, ast.falseExp]);
        }
        if (ast instanceof compiler_1.Binary) {
            return this.getTranslatablesFromAsts([ast.left, ast.right]);
        }
        if (ast instanceof compiler_1.BindingPipe) {
            return this.getTranslatablesFromAst(ast.exp);
        }
        if (ast instanceof compiler_1.LiteralMap) {
            return this.getTranslatablesFromAsts(ast.values);
        }
        if (ast instanceof compiler_1.LiteralArray) {
            return this.getTranslatablesFromAsts(ast.expressions);
        }
        if (ast instanceof compiler_1.MethodCall) {
            return this.getTranslatablesFromAsts(ast.args);
        }
        return [];
    }
    getTranslatablesFromAsts(asts) {
        return this.flatten(asts.map((ast) => this.getTranslatablesFromAst(ast)));
    }
    flatten(array) {
        return [].concat(...array);
    }
    expressionIsOrHasBindingPipe(exp) {
        if (exp.name && exp.name === TRANSLATE_PIPE_NAME) {
            return true;
        }
        if (exp.exp && exp.exp instanceof compiler_1.BindingPipe) {
            return this.expressionIsOrHasBindingPipe(exp.exp);
        }
        return false;
    }
    parseTemplate(template, path) {
        return compiler_1.parseTemplate(template, path).nodes;
    }
}
exports.PipeParser = PipeParser;
//# sourceMappingURL=pipe.parser.js.map
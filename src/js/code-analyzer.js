import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

export {parseCode,itercode, loopItercode};
export {variableDeclaration, expressionStatement, ifStatement, functionDeclaration,whileStatement, getNodes, reaset};
export {MemberExpression, UnaryExpression};

const parseCode = (codeToParse) => {//get string of code, ret jason
    return esprima.parseScript(codeToParse);
};

function rowInDictionary(name, value) {
    return  {
        Name: name,
        Value: value};
}
function nodeCFG (linesInNode,shape,isGreen, type){
    return  {
        LinesInNode: linesInNode,
        Shape: shape,
        IsGreen: isGreen,
        Type: type};
}

let Nodes = [], actions = [], transitions = [];
function getNodes() {return Nodes;}
function reaset() {Nodes = [];}
let index = 1;
function itercode(codeJason, inputsJason) {
    Nodes = [];actions = []; transitions = [];
    index = 1;
    let dictionary = [],nodeLines=[];
    return nodesToSrtDiagram(loopItercode(dictionary, codeJason, nodeLines, true, '', inputsJason));
}

function loopItercode (dictionary, codeJason,nodeLines, color ,type, inputsJason) {
    let  newNodeLines = [];
    for (let i = 0; i < codeJason.body.length; i++){
        if(newNode(Nodes))
            handleByType(codeJason.body[i], dictionary, newNodeLines, color ,type, inputsJason);
        else handleByType(codeJason.body[i], dictionary, nodeLines, color ,'', inputsJason);
    }
    insertLastNode(newNodeLines,nodeLines,color , type);
    return Nodes;
}
function newNode(Nodes) {return (Nodes.length > 1 && (Nodes[Nodes.length - 1].Type === 'end'||Nodes[Nodes.length - 1].Type === 'elseBody'||Nodes[Nodes.length - 2].Shape === 'diamond'));}
function insertLastNode(newNodeLines,nodeLines,color , type) {
    if (newNodeLines.length>0 )
        Nodes.push(nodeCFG(newNodeLines, 'square', color ,type));//6
    if (Nodes.length == 0  && nodeLines.length > 0 )
        Nodes.push(nodeCFG(nodeLines, 'square', color ,type));
}

const funcByType ={
    'FunctionDeclaration': functionDeclaration,
    'VariableDeclaration' : variableDeclaration,
    'ExpressionStatement' : expressionStatement,
    'ReturnStatement' : returnStatement,
    'WhileStatement' : whileStatement,
    'IfStatement' : ifStatement
};

function handleByType(codeJasonBody, dictionary, nodeLines, color ,type,inputsJason) {
    funcByType[codeJasonBody.type](codeJasonBody, dictionary, nodeLines, color ,type, inputsJason);
}

function functionDeclaration(codeJasonBody, dictionary, nodeLines, color ,type, inputsJason) {
    if(inputsJason.body.length>0) {
        if(inputsJason.body[0].expression.type==='SequenceExpression')
            insertParams(codeJasonBody, dictionary, inputsJason);
        else oneParam(dictionary,codeJasonBody.params[0].name, inputsJason );
    }
    loopItercode(dictionary, codeJasonBody.body, nodeLines, color  ,type,inputsJason);
}

function insertParams(codeJasonBody, dictionary, inputsJason){
    let values = inputsJason.body[0].expression.expressions;
    for (let i = 0; i < codeJasonBody.params.length; i++) {
        if(!isVarInDictionary(dictionary, codeJasonBody.params[i].name))
            dictionary.push(rowInDictionary(codeJasonBody.params[i].name, escodegen.generate(values[i])));
        else dictionary[indexVar(codeJasonBody.params[i].name)].Value =  escodegen.generate(values[i]);
    }
}

function oneParam(dictionary, param, inputsJason) {
    if(!isVarInDictionary(dictionary, param))
        dictionary.push(rowInDictionary(param, ''));
    dictionary[indexVar(param)].Value = escodegen.generate(inputsJason.body[0].expression);
}

function variableDeclaration(codeJasonBody, dictionary, nodeLines ) {
    for (let i = 0; i < codeJasonBody.declarations.length; i++) {
        let variable = codeJasonBody.declarations[i];
        dictionary.push(rowInDictionary(variable.id.name, ''));
        if(variable.init!=null) {
            dictionary[indexVar(dictionary, variable.id.name)].Value = substitutionValue(dictionary, variable.init).replace(/\n/g, '');
            nodeLines.push(variable.id.name + ' = ' +  escodegen.generate(variable.init).replace(/\n/g, ''));
        }
        else nodeLines.push(variable.id.name);
    }
}

function expressionStatement(codeJasonBody, dictionary, nodeLines ){
    let exp = codeJasonBody.expression;
    if (exp.type != 'UpdateExpression')
        dictionary[indexVar(dictionary,exp.left.name)].Value = substitutionValue(dictionary, exp.right).replace(/\n/g, '');
    nodeLines.push(escodegen.generate(exp).replace(/\n/g, ''));
}

function returnStatement(codeJasonBody, dictionary, nodeLines, color ) {
    Nodes.push(nodeCFG(['return ' +  escodegen.generate(codeJasonBody.argument)], 'square', color,''));
}

function whileStatement(codeJasonBody, dictionary ,nodeLines, colorBefore ) {
    if (nodeLines.length>0)
        Nodes.push(nodeCFG(nodeLines, 'square', colorBefore,''));
    Nodes.push(nodeCFG(['null'], 'square', colorBefore,'whileNull'));
    Nodes.push(nodeCFG([escodegen.generate(codeJasonBody.test)], 'diamond', colorBefore, 'whileTest'));
    let newNodeLines1 = [];//3
    let isG = isGreen( dictionary, codeJasonBody.test);
    loopItercode(dictionary ,codeJasonBody.body, newNodeLines1, isG ,'whileBody');

    if (newNodeLines1.length>0 && codeJasonBody.body.type != 'IfStatement' )
        Nodes.push(nodeCFG(newNodeLines1, 'square', isG,'whileBody'));//4

    Nodes.push(nodeCFG([], '', isG,'ew'));
}


function ifStatement(codeJasonBody, dictionary, nodeLines, colorBefore ) {
    if (nodeLines.length>0)
        Nodes.push(nodeCFG(nodeLines, 'square', colorBefore,''));// node befor if
    let d = copyDictionary(dictionary);
    Nodes.push(nodeCFG ([escodegen.generate(codeJasonBody.test)], 'diamond' ,colorBefore,'ifTest'));//2

    handleBodyIf(codeJasonBody, dictionary, colorBefore);

    let newNodeLines2 = [];//5
    let isG = isGreen( dictionary, codeJasonBody.test);
    ifOrElse(codeJasonBody, d, newNodeLines2, !isG , colorBefore);

    if(codeJasonBody.alternate == null)
        Nodes.push(nodeCFG ([], '', colorBefore,'end'));
}

function handleBodyIf(codeJasonBody, dictionary, colorBefore) {
    let newNodeLines1 = [];//3
    let isG = isGreen( dictionary, codeJasonBody.test);
    if(codeJasonBody.consequent.type === 'BlockStatement')
        loopItercode(dictionary, codeJasonBody.consequent, newNodeLines1, isG, 'ifBody');
    else funcByType[codeJasonBody.consequent.type](codeJasonBody.consequent, dictionary, newNodeLines1,isG, 'ifBody');
    if (newNodeLines1.length>0)
        Nodes.push(nodeCFG(newNodeLines1, 'square', (colorBefore && isG),'ifBody'));//4
}

function ifOrElse(codeJasonBody, d, newNodeLines, colorElse, colorIf ){
    if (codeJasonBody.alternate != null && codeJasonBody.alternate.type === 'IfStatement')
        ifStatement(codeJasonBody.alternate,d,  newNodeLines, colorElse );
    else if(codeJasonBody.alternate != null) {
        elseStatement(d, codeJasonBody.alternate, newNodeLines, colorElse);
        Nodes.push(nodeCFG ([], '', colorIf,'end'));
    }
}

function elseStatement(dictionary, alt,nodeLines, colorBefore ){
    //if (nodeLines.length>0) Nodes.push(nodeCFG(nodeLines, 'square', colorBefore, 'ifBody'));
    let newNodeLines1 = [];
    if (alt.type === 'BlockStatement')
        loopItercode(dictionary, alt, newNodeLines1, colorBefore , 'elseBody');
    else {
        funcByType[alt.type](alt, dictionary, newNodeLines1, colorBefore, 'elseBody');
        Nodes.push(nodeCFG (newNodeLines1, 'square', colorBefore,'elseBody'));
    }
}

function isGreen(dictionary, exp){
    return eval(substitutionValue(dictionary, exp));
}

function substitutionValue(dictionary, valueJason){
    return valueType[valueJason.type](dictionary,valueJason);
}

const valueType ={
    'Literal': Literal,
    'Identifier' : Identifier,
    'UnaryExpression' : UnaryExpression,
    'BinaryExpression' : BinaryExpression,
    'MemberExpression' : MemberExpression,
    'ArrayExpression' :ArrayExpression
};

function Literal(dictionary,valueJason){
    return escodegen.generate(valueJason);
}

function Identifier(dictionary,valueJason) {
    return dictionary[indexVar(dictionary, escodegen.generate(valueJason))].Value;
}

function UnaryExpression(dictionary,valueJason) {
    return valueJason.operator + '(' +substitutionValue(dictionary, valueJason.argument)+')';
}

function BinaryExpression(dictionary,valueJason) {
    return '('+ substitutionValue(dictionary, valueJason.left) + ' '+ valueJason.operator +' '+ substitutionValue(dictionary, valueJason.right)+')';
}

function MemberExpression(dictionary,valueJason){
    let array = JSON.parse( dictionary[indexVar(dictionary, escodegen.generate(valueJason.object))].Value );
    return array[substitutionValue(dictionary, valueJason.property)];
}

function ArrayExpression(dictionary,valueJason) {
    return  escodegen.generate(valueJason);
}

function copyDictionary(dictionary){
    let d =[];
    for (let i=0; i<dictionary.length; i++)
        d.push(rowInDictionary(dictionary[i].Name, dictionary[i].Value));
    return d;
}

function isVarInDictionary(dic, variable){
    for (let i=0; i<dic.length; i++){
        if (dic[i].Name === variable)
            return true;
    }
    return false;
}

function indexVar(dic, variable){
    for (let i=0; i<dic.length; i++){
        if (dic[i].Name === variable)
            return i;
    }
}

const nodeType ={
    'ifTest': ifTestNode,
    'ifBody' : ifBodyNode,
    'end' : endNode,
    'elseBody' : elseBodyNode,
    'whileTest' : whileTestNode,
    'whileBody' : whileBodyNode,
    'whileNull' : whileNullNode,
    'ew' : whileEnd,
    '' : noType
};

function nodesToSrtDiagram(Nodes) {
    if(Nodes.length != 1 )firstNode(Nodes);
    let i=0;
    while (i < Nodes.length){
        nodeType[Nodes[i].Type](Nodes, i);
        i++;
    }
    return arraysToStr(actions, transitions);
}

function firstNode(Nodes) {
    if(Nodes.length > 0 && Nodes[0].Type === '') {
        if(Nodes.length > 1 && Nodes[1].Type === 'ifTest')
            transitions.push('op0->cond1\n');
        else transitions.push('op0->op1\n');
    }
}

function ifTestNode(Nodes, i){
    if(Nodes[i].IsGreen == true)// test node
        actions.push('cond' + i + '=>condition: -'+index+'-\n'+ Nodes[i].LinesInNode + '|thePath\n');
    else actions.push('cond' + i + '=>condition: -'+index+'-\n'+ Nodes[i].LinesInNode + '\n');
    index++;
    if(Nodes[i+1].Type != 'ifTest') // test to body
        transitions.push('cond' + i  + '(yes)->' + 'op' + (i+1) + '\n');
    else transitions.push('cond' + i  + '(yes)->' + 'cond' + (i+1) + '\n');
    condNo(Nodes, i);
}

function condNo(Nodes, i){
    if (ifElseAfterIf(Nodes, i))
        transitions.push('cond' + i + '(no)->' + 'cond' + (i + 2) + '\n');
    else if (elseAfterIf(Nodes, i))
        transitions.push('cond' + i + '(no)->' + 'op' + (i + 2) + '\n');
    else {
        let j = increasJ(Nodes, i,'end');
        if(Nodes[i+1].Type === 'ifTest')
            transitions.push('cond' + i + '(no)->' + 'st' + (j+1) + '\n');
        else transitions.push('cond' + i + '(no)->' + 'st' + j + '\n');
    }
}
function ifElseAfterIf(Nodes, i) {return Nodes.length > (i +2) && Nodes[i + 2].Type ==='ifTest'; }
function elseAfterIf(Nodes, i) {return Nodes.length > (i +2) && Nodes[i + 2].Type=== 'elseBody'; }

function ifBodyNode(Nodes, i){
    if(Nodes[i].IsGreen == true)
        actions.push('op' + i + '=>operation: -'+index+'-\n'+ Nodes[i].LinesInNode + '|thePath\n');
    else actions.push('op' + i + '=>operation: -'+index+'-\n'+ Nodes[i].LinesInNode + '\n');
    index++;
    let j=  increasJ(Nodes, i,'end');
    transitions.push('op' + i + '->' + 'st' + j + '\n');

    /*if(Nodes[i+1].Type.includes('Test'))
        transitions.push('op' + i + '->' + 'cond' + (i+1) + '\n');*/
}

function endNode(Nodes, i) {
    insertEnd(Nodes, i);
    let j=deacresJ(Nodes, i);
    if(condAfterIf(Nodes, i))
        transitions.push('st' + i + '->cond' + (i+1)+'\n');
    else if (Nodes[j].Type === 'whileNull' && increasJ(Nodes, j, 'ew') > i)
        transitions.push('st' + i + '->op' + j+'\n');
    else if(i < Nodes.length - 1)
        endToAfterIf(Nodes, i);
}

function insertEnd(Nodes, i){
    if(Nodes[i].IsGreen == true)
        actions.push('st' + i +'=>start: null|thePath\n');
    else actions.push('st' + i +'=>start: null\n');
}

function condAfterIf(Nodes, i){return i < Nodes.length - 2 && Nodes[i+1].Type.includes('Test');}

function endToAfterIf(Nodes, i){
    if( Nodes[i+1].Type !='end')
        transitions.push('st' + i + '->op' + (i+1)+'\n');
    else transitions.push('st' + i + '->st' + (i+1)+'\n');
}

function elseBodyNode(Nodes, i){
    if(Nodes[i].IsGreen == true)
        actions.push('op' + i + '=>operation: -'+index+'-\n'+ Nodes[i].LinesInNode + '|thePath\n');
    else actions.push('op' + i + '=>operation: -'+index+'-\n'+ Nodes[i].LinesInNode + '\n');
    index++;
    let j=  increasJ(Nodes, i,'end');
    transitions.push('op' + i + '->' + 'st' + j + '\n');
}

function whileNullNode(Nodes, i) {
    if(Nodes[i].IsGreen == true)
        actions.push('op' + i + '=>operation: -'+index+'-\n'+ 'Null' + '|thePath\n');
    else actions.push('op' + i + '=>operation: -'+index+'-\n'+ 'Null' + '\n');
    index++;
}

function whileTestNode(Nodes, i){
    if(Nodes[i].IsGreen == true)//test node
        actions.push('cond' + i + '=>condition: -'+index+'-\n'+ Nodes[i].LinesInNode + '|thePath\n');
    else actions.push('cond' + i + '=>condition: -'+index+'-\n'+ Nodes[i].LinesInNode + '\n');
    index++;
    transitions.push('op' + (i-1) + '->' + 'cond' + i + '\n'); //whileNull->whileTest

    if(!Nodes[i+1].Type.includes('Test'))// whileTest->whileBody
        transitions.push('cond' + i  + '(yes)->' + 'op' + (i+1) + '\n');
    else transitions.push('cond' + i  + '(yes)->' + 'cond' + (i+1) + '\n');

    testToAfterWhile(Nodes,i);
}

function testToAfterWhile(Nodes,i){
    let j=  increasJ(Nodes, i,'ew');
    if(j<Nodes.length - 1) {
        if (Nodes[j + 1].Type === '')
            transitions.push('cond' + i + '(no)->' + 'op' + (j + 1) + '\n');
        //else if (Nodes[j + 1].Type.includes('Test')) transitions.push('cond' + i + '(no)->' + 'cond' + (j + 1) + '\n');
        else transitions.push('cond' + i + '(no)->' + 'st' + (j+1) + '\n');
    }
}

function whileBodyNode(Nodes, i){
    if(Nodes[i].IsGreen == true)
        actions.push('op' + i + '=>operation: -'+index+'-\n'+ Nodes[i].LinesInNode + '|thePath\n');
    else actions.push('op' + i + '=>operation: -'+index+'-\n'+ Nodes[i].LinesInNode + '\n');
    index++;

    let j = deacresJ(Nodes, i);
    transitions.push('op' + i + '->' + 'op' + j + '\n'); //whileBody->whileNull
}

function increasJ(Nodes, i ,e){
    let j = i + 1;
    while (j < Nodes.length-1 && Nodes[j].Type != e)
        j++;
    return j;
}
function deacresJ(Nodes, i) {
    let j = i-1;
    while (j > 0 && Nodes[j].Type != 'whileNull')
        j--;
    return j;
}

function whileEnd (Nodes, i)  {return Nodes[i];}

function noType(Nodes, i) {
    //if(Nodes[i].IsGreen == true )
    actions.push('op' + i + '=>operation: -' + index + '-\n' + Nodes[i].LinesInNode+ '|thePath\n');
    //else actions.push('op' + i +'=>operation: -'+index+'-\n'+ Nodes[i].LinesInNode + '\n');
    index++;
}

function arraysToStr(a, t) {
    let ans = '';
    for (let i=0; i<a.length; i++) ans = ans + a[i];
    for (let i=0; i<t.length; i++) ans = ans + t[i];
    return ans;
}
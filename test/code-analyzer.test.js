import assert from 'assert';
import {parseCode,itercode} from '../src/js/code-analyzer';

import {variableDeclaration, expressionStatement, ifStatement, functionDeclaration,whileStatement}from '../src/js/code-analyzer';
import {MemberExpression, UnaryExpression} from '../src/js/code-analyzer';
import {getNodes, reaset}from '../src/js/code-analyzer';

describe('variableDeclaration', () => {
    it('variableDeclaration init', () => {
        let dictionary1 =[], nodeLines1=[];
        variableDeclaration(parseCode('let e = 7;').body[0],dictionary1, nodeLines1);
        assert.deepEqual(dictionary1, [{Name:'e',Value:7}]);
        assert.deepEqual(nodeLines1, ['e = 7']);
    });
    it('variableDeclaration no init', () => {
        let dictionary1 =[], nodeLines1=[];
        variableDeclaration(parseCode('let e;').body[0],dictionary1, nodeLines1);
        assert.deepEqual(dictionary1, [{Name:'e',Value:''}]);
        assert.deepEqual(nodeLines1, ['e']);
    });
    it('variableDeclaration init array', () => {
        let dictionary1 =[], nodeLines1=[];
        variableDeclaration(parseCode('let e = [1,2,3];').body[0],dictionary1, nodeLines1);
        assert.deepEqual(dictionary1, [{Name:'e',Value:'[    1,    2,    3]'}]);
        assert.deepEqual(nodeLines1, ['e = [    1,    2,    3]']);
    });
});

describe('expressionStatement', () => { it('expressionStatement', () => {
    let dictionary2 =[{Name:'e',Value:5}], nodeLines2=[];
    expressionStatement(parseCode('e = 7;').body[0],dictionary2, nodeLines2);
    assert.deepEqual(dictionary2, [{Name:'e',Value:7}]);
    assert.deepEqual(nodeLines2, ['e = 7']);
});});

describe('ifStatement', () => {
    it('ifStatement BS', () => {
        reaset();
        let dictionary3 =[],  nodeLines3=[];
        ifStatement(parseCode('if(2 < 3){let e=44; }').body[0],dictionary3, nodeLines3, true);
        assert.deepEqual(dictionary3, [{Name:'e',Value:44}]);
        assert.deepEqual(getNodes(),[{LinesInNode: ['2 < 3'], Shape:'diamond', IsGreen:true, Type:'ifTest'},
            {LinesInNode: ['e = 44'], Shape:'square', IsGreen:true, Type:'ifBody'},
            {LinesInNode: [], Shape:'', IsGreen:true, Type:'end'}]);
    });
    it('ifStatement no BS', () => {
        reaset();
        let dictionary3 =[{Name:'e',Value:0}],  nodeLines3=[];
        ifStatement(parseCode('if(2 < 3) e=44;').body[0],dictionary3, nodeLines3, true);
        assert.deepEqual(dictionary3, [{Name:'e',Value:44}]);
        assert.deepEqual(getNodes(),[{LinesInNode: ['2 < 3'], Shape:'diamond', IsGreen:true, Type:'ifTest'},
            {LinesInNode: ['e = 44'], Shape:'square', IsGreen:true, Type:'ifBody'},
            {LinesInNode: [], Shape:'', IsGreen:true, Type:'end'}]);
    });
});

describe('ifStatement', () => {
    it('ifStatement else', () => {
        reaset();
        let dictionary3 =[{Name:'e',Value:0}],  nodeLines3=[];
        ifStatement(parseCode('if(2 < 3){ e=44;} else e=66;').body[0],dictionary3, nodeLines3, true);
        assert.deepEqual(dictionary3, [{Name:'e',Value:44}]);
        assert.deepEqual(getNodes(),[{LinesInNode: ['2 < 3'], Shape:'diamond', IsGreen:true, Type:'ifTest'},
            {LinesInNode: ['e = 44'], Shape:'square', IsGreen:true, Type:'ifBody'},
            {LinesInNode: ['e = 66'], Shape:'square', IsGreen:false, Type:'elseBody'},
            {LinesInNode: [], Shape:'', IsGreen:true, Type:'end'}]);
    });
});

describe('whileStatement', () => {
    it('whileStatement', () => {
        reaset();
        let dictionary =[{Name:'e',Value:0}],  nodeLines=[];
        whileStatement(parseCode('while( e < 3){ e=e+1;}').body[0],dictionary, nodeLines, true);
        assert.deepEqual(getNodes(),[{LinesInNode: ['null'], Shape:'square', IsGreen:true, Type:'whileNull'},
            {LinesInNode: ['e < 3'], Shape:'diamond', IsGreen:true, Type:'whileTest'},
            {LinesInNode: ['e = e + 1'], Shape:'square', IsGreen:true, Type:'whileBody'},
            {LinesInNode: [], Shape:'', IsGreen:true, Type:'ew'}]);
    });
});

describe('functionDeclaration', () => {
    it('functionDeclaration 3 params', () => {
        reaset();
        let dictionary4 =[],  nodeLines4=[];
        functionDeclaration(parseCode('function foo(x,y,z) {}').body[0],dictionary4, nodeLines4, true,'',parseCode('1,2,3'));
        assert.deepEqual(dictionary4, [{Name:'x',Value:1}, {Name:'y',Value:2}, {Name:'z',Value:3}]);
        assert.deepEqual(getNodes(), []);
    });
    it('functionDeclaration 1 params', () => {
        reaset();
        let dictionary4 =[],  nodeLines4=[];
        functionDeclaration(parseCode('function foo(x) {}').body[0],dictionary4, nodeLines4, true,'',parseCode('1'));
        assert.deepEqual(dictionary4, [{Name:'x',Value:1}]);
        assert.deepEqual(getNodes(), []);
    });
});

describe('functionDeclaration', () => {
    it('functionDeclaration global var, 3 params', () => {
        reaset();
        let dictionary4 =[{Name:'x',Value:7}],  nodeLines4=[];
        functionDeclaration(parseCode('function foo(x,y,z) {}').body[0],dictionary4, nodeLines4, true,'',parseCode('1,2,3'));
        assert.deepEqual(dictionary4, [{Name:'x',Value:1}, {Name:'y',Value:2}, {Name:'z',Value:3}]);
        assert.deepEqual(getNodes(), []);
    });
    it('functionDeclaration global var, 1 params', () => {
        reaset();
        let dictionary4 =[{Name:'x',Value:7}, {Name:'y',Value:7}],  nodeLines4=[];
        functionDeclaration(parseCode('function foo(x) {}').body[0],dictionary4, nodeLines4, true,'',parseCode('1'));
        assert.deepEqual(dictionary4, [{Name:'x',Value:1}, {Name:'y',Value:7}]);
        assert.deepEqual(getNodes(), []);
    });
});

describe('functionDeclaration', () => { it('functionDeclaration and if', () => {
    reaset();
    let dictionary4 =[],  nodeLines4=[];
    functionDeclaration(parseCode('function foo() {if(2 < 3){let e=44; }}').body[0],dictionary4, nodeLines4, true,'',parseCode(''));
    assert.deepEqual(dictionary4, [{Name:'e',Value:44}]);
    assert.deepEqual(getNodes(),[{LinesInNode: ['2 < 3'], Shape:'diamond', IsGreen:true, Type:'ifTest'},
        {LinesInNode: ['e = 44'], Shape:'square', IsGreen:true, Type:'ifBody'},
        {LinesInNode: [], Shape:'', IsGreen:true, Type:'end'}]);
});});

describe('MemberExpression', () => {
    it('MemberExpression number property', () => {
        reaset();
        let dictionary =[{Name:'e',Value:'[8,9]'}];
        assert.deepEqual(MemberExpression(dictionary, parseCode('e[0]').body[0].expression), 8);
    });
    it('MemberExpression var property', () => {
        reaset();
        let dictionary =[{Name:'e',Value:'[8,9]'}, {Name:'x',Value:1}];
        assert.deepEqual(MemberExpression(dictionary, parseCode('e[x]').body[0].expression), 9);
    });
});

describe('UnaryExpression', () => {
    it('UnaryExpression', () => {
        reaset();
        let dictionary =[{Name:'e',Value:'1'}];
        assert.deepEqual(UnaryExpression(dictionary, parseCode('-e').body[0].expression), '-(1)');
    });
});

describe('one node', () => {it('one node', () => {
    assert.deepEqual(itercode(parseCode('function foo(){let e=4; }'), parseCode('')),
        'op0=>operation: -1-\ne = 4|thePath\n');
});});

describe('functionDeclaration', () => {it('functionDeclaration and if from itercode', () => {
    assert.deepEqual(itercode(parseCode('function foo() {if(2 < 3){let e=44; }}'), parseCode('')),
        'cond0=>condition: -1-\n2 < 3|thePath\n' +
        'op1=>operation: -2-\ne = 44|thePath\n' +
        'st2=>start: null|thePath\n' +
        'cond0(yes)->op1\n' +
        'cond0(no)->st2\n' +
        'op1->st2\n');
});});

describe('if in if', () => {it('if in if', () => {
    assert.deepEqual(itercode(parseCode('function foo(){\n' +
        'let c=0;\n' +
        '   if (3 < 1) {\n' +
        '     if (5>6){\n' +
        '        c = 5;}}\n' +
        '    return c;\n}'), parseCode('')), 'op0=>operation: -1-\nc = 0|thePath\n' +
        'cond1=>condition: -2-\n3 < 1|thePath\n' +
        'cond2=>condition: -3-\n5 > 6\n' +
        'op3=>operation: -4-\nc = 5\n' +
        'st4=>start: null\n' +
        'st5=>start: null|thePath\n' +
        'op6=>operation: -5-\nreturn c|thePath\n' +
        'op0->cond1\n' +
        'cond1(yes)->cond2\n' + 'cond1(no)->st5\n' +
        'cond2(yes)->op3\n' + 'cond2(no)->st4\n' +
        'op3->st4\n' +
        'st4->st5\n' +
        'st5->op6\n');
});});

describe('if in while', () => {it('if in while', () => {
    assert.deepEqual(itercode(parseCode('function f(){\n' +
        'let r=0;\n' +
        'while (1<2){\n' +
        'if(3>4){r=3;}\n' +
        '}\n' +
        'return r;\n}'), parseCode('')), 'op0=>operation: -1-\nr = 0|thePath\n' +
        'op1=>operation: -2-\nNull|thePath\n' +
        'cond2=>condition: -3-\n1 < 2|thePath\n' +
        'cond3=>condition: -4-\n3 > 4|thePath\n' +
        'op4=>operation: -5-\nr = 3\n' +
        'st5=>start: null|thePath\n' +
        'op7=>operation: -6-\nreturn r|thePath\n' +
        'op0->op1\n' +
        'op1->cond2\n' +
        'cond2(yes)->cond3\n' + 'cond2(no)->op7\n' +
        'cond3(yes)->op4\n' + 'cond3(no)->st5\n' +
        'op4->st5\n' +
        'st5->op1\n');
});});

describe('if after if', () => {it('if after if', () => {
    assert.deepEqual(itercode(parseCode('function foo(){\n' +
        'let u =0;\n' +
        'if (1>2){ u=1;}\n' +
        'if (2>1){ u=2;}}\n'), parseCode('')), 'op0=>operation: -1-\nu = 0|thePath\n' +
        'cond1=>condition: -2-\n1 > 2|thePath\n' +
        'op2=>operation: -3-\nu = 1\n' +
        'st3=>start: null|thePath\n' +
        'cond4=>condition: -4-\n2 > 1|thePath\n' +
        'op5=>operation: -5-\nu = 2|thePath\n' +
        'st6=>start: null|thePath\n' +
        'op0->cond1\n' +
        'cond1(yes)->op2\n' + 'cond1(no)->st3\n' +
        'op2->st3\n' +
        'st3->cond4\n' +
        'cond4(yes)->op5\n' + 'cond4(no)->st6\n' +
        'op5->st6\n');
});});

describe('if else', () => {it('if else', () => {
    assert.deepEqual(itercode(parseCode('function foo(){\n' +
        'let c=0;\n' +
        '   if (3 < 1) {\n' +
        '        c = 5;}\n' +
        'else {c=4;}    \n' +
        '    return c;\n' +
        '}\n'), parseCode('')), 'op0=>operation: -1-\nc = 0|thePath\n' +
        'cond1=>condition: -2-\n3 < 1|thePath\n' +
        'op2=>operation: -3-\nc = 5\n' +
        'op3=>operation: -4-\nc = 4|thePath\n' +
        'st4=>start: null|thePath\n' +
        'op5=>operation: -5-\nreturn c|thePath\n' +
        'op0->cond1\n' +
        'cond1(yes)->op2\n' +
        'cond1(no)->op3\n' +
        'op2->st4\n' +
        'op3->st4\n' +
        'st4->op5\n');
});});

describe('while1', () => {it('while1', () => {
    assert.deepEqual(itercode(parseCode('function foo(){\n' +
        '   let a = 2;\n' +
        '   while (a > 9) {a++;}\n' +
        '   return z;}\n'), parseCode('')), 'op0=>operation: -1-\na = 2|thePath\n' +
        'op1=>operation: -2-\nNull|thePath\n' +
        'cond2=>condition: -3-\na > 9|thePath\n' +
        'op3=>operation: -4-\na++\n' +
        'op5=>operation: -5-\nreturn z|thePath\n' +
        'op0->op1\n' +
        'op1->cond2\n' +
        'cond2(yes)->op3\n' +
        'cond2(no)->op5\n' +
        'op3->op1\n');
});});
describe('while2', () => {it('while2', () => {
    assert.deepEqual(itercode(parseCode('function f(){\n' +
        'let r=4;\n' +
        'while(5>6){r=9;}\n' +
        '}'), parseCode('')), 'op0=>operation: -1-\nr = 4|thePath\n' +
        'op1=>operation: -2-\nNull|thePath\n' +
        'cond2=>condition: -3-\n5 > 6|thePath\n' +
        'op3=>operation: -4-\nr = 9\n' +
        'op0->op1\n' +
        'op1->cond2\n' +
        'cond2(yes)->op3\n' +
        'op3->op1\n');
});});

describe('while in if', () => {it('while in if', () => {
    assert.deepEqual(itercode(parseCode('function f(){\n' +
        'let r=0;\n' +
        'if(3>4){\n' +
        'while(5>6){r=99;}\n' +
        '}\n' +
        'return r;\n}'), parseCode('')), 'op0=>operation: -1-\nr = 0|thePath\n' +
        'cond1=>condition: -2-\n3 > 4|thePath\n' +
        'op2=>operation: -3-\nNull\n' +
        'cond3=>condition: -4-\n5 > 6\n' +
        'op4=>operation: -5-\nr = 99\n' +
        'st6=>start: null|thePath\n' +
        'op7=>operation: -6-\nreturn r|thePath\n' +
        'op0->cond1\n' +
        'cond1(yes)->op2\n' + 'cond1(no)->st6\n' +
        'op2->cond3\n' +
        'cond3(yes)->op4\n' + 'cond3(no)->st6\n' +
        'op4->op2\n' +
        'st6->op7\n');
});});

describe('array param', () => {it('array param', () => {
    assert.deepEqual(itercode(parseCode('function f(x){\n' +
        'let a=0;\n' +
        'if (x[0]){a=9;}\n' +
        'else if (x[1]){a=9;}\n' +
        'return a;}'), parseCode('[1,0,2]')), 'op0=>operation: -1-\na = 0|thePath\n' +
        'cond1=>condition: -2-\nx[0]|thePath\n' +
        'op2=>operation: -3-\na = 9|thePath\n' +
        'cond3=>condition: -4-\nx[1]\n' +
        'op4=>operation: -5-\na = 9\n' +
        'st5=>start: null\n' +
        'op6=>operation: -6-\nreturn a|thePath\n' +
        'op0->cond1\n' +
        'cond1(yes)->op2\n' + 'cond1(no)->cond3\n' +
        'op2->st5\n' +
        'cond3(yes)->op4\n' + 'cond3(no)->st5\n' +
        'op4->st5\n' +
        'st5->op6\n');
});});

let example1 = 'function foo(x, y, z){' +
    'let a = x + 1; let b = a + y; let c = 0;'+
    'if (b < z) {c = c + 5;}' +
    'else if (b < z * 2) { c = c + x + 5;}'+
    'else {c = c + z + 5;}' +
    'return c;}';
describe('example1', () => { it('example1', () => {
    assert.deepEqual(itercode(parseCode(example1),parseCode('1,2,3')),
        'op0=>operation: -1-\na = x + 1,b = a + y,c = 0|thePath\n' +
        'cond1=>condition: -2-\nb < z|thePath\n' +
        'op2=>operation: -3-\nc = c + 5\n' +
        'cond3=>condition: -4-\nb < z * 2|thePath\n' +
        'op4=>operation: -5-\nc = c + x + 5|thePath\n' +
        'op5=>operation: -6-\nc = c + z + 5\n' +
        'st6=>start: null|thePath\n' +
        'op7=>operation: -7-\nreturn c|thePath\n' +
        'op0->cond1\n' +
        'cond1(yes)->op2\n' + 'cond1(no)->cond3\n' +
        'op2->st6\n' +
        'cond3(yes)->op4\n' + 'cond3(no)->op5\n' +
        'op4->st6\n' +
        'op5->st6\n'+
        'st6->op7\n');
});});


describe('example2', () => { it('example2', () => {
    assert.deepEqual(itercode(parseCode(
        'function foo(x, y, z){' +
        'let a = x + 1; let b = a + y; let c = 0;'+
        'while (a < z) {'+
        'c = a + b;'+
        'z = c * 2;'+
        'a++;}'+
        'return z;}'),parseCode('1,2,3')), 'op0=>operation: -1-\na = x + 1,b = a + y,c = 0|thePath\n' +
        'op1=>operation: -2-\nNull|thePath\n' +
        'cond2=>condition: -3-\na < z|thePath\n' +
        'op3=>operation: -4-\nc = a + b,z = c * 2,a++|thePath\n' +
        'op5=>operation: -5-\nreturn z|thePath\n' +
        'op0->op1\n' +
        'op1->cond2\n' +
        'cond2(yes)->op3\n' +
        'cond2(no)->op5\n' +
        'op3->op1\n');
});});
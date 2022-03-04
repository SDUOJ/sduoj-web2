// 表格中的默认页数
export const defaultPageSize = 20
export const UrlPrefix = "/v2"
export const MaxCodeLength = 1024 * 50

export const PREDEFINED_CHECKERS = [
    {
        name: 'lcmp.cpp',
        description: 'Lines, ignores whitespaces'
    },
    {
        name: 'hcmp.cpp',
        description: 'Single huge integer'
    },
    {
        name: 'ncmp.cpp',
        description: 'Single or more int64, ignores whitespaces'
    },
    {
        name: 'nyesno.cpp',
        description: 'Zero or more yes/no, case insensitive'
    },
    {
        name: 'rcmp4.cpp',
        description: 'Single or more double, max any error 1E-4'
    },
    {
        name: 'rcmp6.cpp',
        description: 'Single or more double, max any error 1E-6'
    },
    {
        name: 'rcmp9.cpp',
        description: 'Single or more double, max any error 1E-9'
    },
    {
        name: 'wcmp.cpp',
        description: 'Sequence of tokens'
    },
    {
        name: 'yesno.cpp',
        description: 'Single yes or no, case insensitive'
    }
];


export const SPJ_Code = `/*
此代码需要使用 C++ 编写，可以使用 Testlib 库，
其用法请参见：https://oi-wiki.org/tools/testlib/
*/`

export const SPJ_Config = `{
  "compile": {
    "srcName": "spj.cc",
    "maxCpuTime": 5000,
    "maxRealTime": 6000,
    "maxMemory": 262144,
    "commands": [
      "/usr/bin/g++ -I/ -DONLINE_JUDGE -O2 -w -fmax-errors=3 -std=c++11 spj.cc -lm -o spj"
    ]
  },
  "run": {
    "command": "spj",
    "seccompRule": null,
    "maxCpuTimeFactor": 2,
    "maxRealTimeFactor": 2,
    "maxMemoryFactor": 1,
    "envs": null
  }
}`
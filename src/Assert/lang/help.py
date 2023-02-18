import json
import re

key = ""
enText = "Exit group"
chText = "退出组"

fe = open("en.json", encoding="utf8")
fz = open("zh.json", encoding="utf8")

en = json.loads(fe.read())
zh = json.loads(fz.read())

fe.close()
fz.close()

for x in zh:
    if chText == zh[x]:
        print("找到对应字段")
        print("key -> ", x)
        print("en -> ", en[x])
        print("zh -> ", zh[x])

        print("const {t} = useTranslation()")
        print("this.props.t(\"{}\")".format(x))
        print("props.t(\"{}\")".format(x))
        print("t(\"{}\")".format(x))
        break

if len(enText) != 0 and len(chText) != 0:



    def camel(s):
        s = re.sub(r"(\s|_|-)+", " ", s).title().replace(" ", "")
        return s[0].lower() + s[1:]

    if len(key) == 0:
        key = camel(enText)

    en[key] = enText
    zh[key] = chText

    print("已录入字段")
    print("key -> ", key)
    print("en -> ", en[key])
    print("zh -> ", zh[key])

    print("const {t} = useTranslation()")
    print("this.props.t(\"{}\")".format(key))
    print("props.t(\"{}\")".format(key))
    print("t(\"{}\")".format(key))

    fe = open("en.json", mode="w", encoding="utf8")
    fz = open("zh.json", mode="w", encoding="utf8")

    fe.write(json.dumps(en))
    fz.write(json.dumps(zh))

    fe.close()
    fz.close()

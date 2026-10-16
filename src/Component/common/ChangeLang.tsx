import React, { useCallback, useEffect, useMemo } from 'react';
import { Select, Space } from 'antd';
import lang from 'Assert/img/language.png';
import i18n from 'i18next';
import { language, languageMap } from '../../Config/i18n';
import { connect } from 'react-redux';
import { ConfigState } from '../../Type/IConfig';
import { ConfigAction } from '../../Redux/Action/config';
import { Locale } from 'antd/es/locale';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { initLanguage } from '../../Utils/initLanguage';

const { Option } = Select;

const ChangeLang = (props: any) => {
  const defLang = useMemo(initLanguage, []);
  const { ChangeLanguage } = props;

  const changeLang = useCallback(
    (value: string) => {
      i18n.changeLanguage(value);
      const id = language.findIndex((item) => {
        return item.id === value;
      });
      ChangeLanguage(languageMap[value], language[id].code);
      dayjs.locale(language[id].time);
      document.documentElement.lang = value === 'zh' ? 'zh-CN' : 'en';
      localStorage.setItem('language', language[id].code);
    },
    [ChangeLanguage],
  );

  // apply the resolved language once on mount
  useEffect(() => {
    changeLang(defLang);
  }, [changeLang, defLang]);

  return (
    <>
      <Space>
        <img src={lang} alt={'lang'} width={20} />
        <Select
          aria-label="Language"
          onChange={changeLang}
          defaultValue={defLang}
          variant={'borderless'}
          style={{ marginLeft: -15 }}
        >
          {language.map((r, i) => {
            return (
              <Option key={i.toString()} value={r.id}>
                {r.name}
              </Option>
            );
          })}
        </Select>
      </Space>
    </>
  );
};

const mapStateToProps = (state: any) => {
  const State: ConfigState = state.ConfigReducer;
  return {
    lang: State.lang,
  };
};

const mapDispatchToProps = (dispatch: any) => ({
  ChangeLanguage: (lang: Locale, langCode: string) =>
    dispatch({
      type: 'updateLanguage',
      lang: lang,
      langCode: langCode,
    }),
});

export default connect(mapStateToProps, mapDispatchToProps)(ChangeLang);

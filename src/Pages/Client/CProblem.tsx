import { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Card, Space, Tag } from 'antd';
import CApi from 'Utils/API/c-api';
import TableWithPagination from '../../Component/common/Table/TableWithPagination';
import { CheckOutlined } from '@ant-design/icons';
import { UrlPrefix } from '../../Config/constValue';
import { withTranslation } from 'react-i18next';

class CProblem extends Component<any, any> {
  constructor(props: any, context: any) {
    super(props, context);
    this.state = {
      ACList: [],
    };
  }

  componentDidMount() {
    CApi.getACProblem()
      .then((res: any) => {
        this.setState({
          ACList: res,
        });
      })
      .catch(() => {
        // Guests can browse the catalog without personal acceptance data.
      });
  }

  render() {
    return (
      <>
        <div style={{ textAlign: 'center', margin: '0 auto' }}>
          <div style={{ textAlign: 'left', maxWidth: '1500px', margin: '0 auto' }}>
            <Card title={this.props.t('ProblemList')}>
              <TableWithPagination
                API={CApi.getProblemList}
                columns={[
                  {
                    title: this.props.t('problemCode'),
                    dataIndex: 'problemCode',
                    key: 'problemCode',
                    width: '120px',
                    render: (text: string) => {
                      let ps = text.split('-');
                      return (
                        <>
                          <span style={{ fontWeight: 'bold' }}>{ps[0]}</span>-<span>{ps[1]}</span>
                        </>
                      );
                    },
                  },
                  {
                    title: this.props.t('title'),
                    dataIndex: 'problemTitle',
                    key: 'problemTitle',
                    width: '300px',
                    render: (text: string, row: any) => {
                      return (
                        <>
                          <Space size={3}>
                            <Link
                              to={`${UrlPrefix}/problem/${encodeURIComponent(row.problemCode)}`}
                              style={{ fontSize: 12 }}
                            >
                              {text}
                            </Link>
                            {this.state.ACList.indexOf(row.problemCode) !== -1 && (
                              <CheckOutlined style={{ color: 'green' }} />
                            )}
                            {row.isPublic === 0 && (
                              <Tag color={'orange'}>{this.props.t('private')}</Tag>
                            )}
                          </Space>
                        </>
                      );
                    },
                  },
                  {
                    title: this.props.t('source'),
                    dataIndex: 'source',
                    key: 'source',
                    width: '450px',
                  },
                  {
                    title: this.props.t('acceptNumber'),
                    dataIndex: 'acceptNum',
                    key: 'acceptNum',
                    width: '120px',
                  },
                ]}
                size={'small'}
                name={'C-ProblemList-Main'}
              />
            </Card>
          </div>
        </div>
      </>
    );
  }
}

export default withTranslation()(withRouter(CProblem));

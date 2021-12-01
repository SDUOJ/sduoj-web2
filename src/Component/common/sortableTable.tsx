import {Component} from "react";
import {Table} from 'antd';

import {MenuOutlined} from '@ant-design/icons';
import {arrayMoveImmutable} from 'array-move';
import {SortableContainer, SortableElement, SortableHandle} from 'react-sortable-hoc';

// 可拖拽的排序手柄
const DragHandle = SortableHandle(() => <MenuOutlined style={{cursor: 'grab', color: '#999'}}/>);

const columns = [
    {
        title: 'Sort',
        dataIndex: 'sort',
        width: 30,
        className: 'drag-visible',
        render: () => <DragHandle/>,
    },
    {
        title: 'Name',
        dataIndex: 'name',
        className: 'drag-visible',
    },
    {
        title: 'Age',
        dataIndex: 'age',
    },
    {
        title: 'Address',
        dataIndex: 'address',
    },
];

const data: any = [
    {
        key: '1',
        name: 'John Brown',
        age: 32,
        address: 'New York No. 1 Lake Park',
        index: 0,
    },
    {
        key: '2',
        name: 'Jim Green',
        age: 42,
        address: 'London No. 1 Lake Park',
        index: 1,
    },
    {
        key: '3',
        name: 'Joe Black',
        age: 32,
        address: 'Sidney No. 1 Lake Park',
        index: 2,
    },
];

const SortableItem = SortableElement((props: any) => <tr {...props} />);
const XSortableContainer = SortableContainer((props: any) => <tbody {...props} />);

export class SortableTable extends Component {
    state = {
        dataSource: data,
    };

    // 排序结束后
    onSortEnd = ({oldIndex, newIndex}: any) => {
        const {dataSource} = this.state;
        console.log(dataSource)
        console.log(oldIndex, newIndex)

        // 当前排序是有效的
        if (oldIndex !== newIndex) {
            // 移动数组中的元素，并设置到当前的状态
            let newData = arrayMoveImmutable(dataSource, oldIndex, newIndex)
            this.setState({
                dataSource: newData
            });
        }
    };

    DraggableContainer = (props: any) => (
        <XSortableContainer
            useDragHandle
            disableAutoscroll
            helperClass="row-dragging"
            onSortEnd={this.onSortEnd}
            {...props}
        />
    );

    DraggableBodyRow = ({className, style, ...restProps}: any) => {
        const {dataSource} = this.state;
        // function findIndex base on Table rowKey props and should always be a right array index
        const index = dataSource.findIndex((x: any) => x.index === restProps['data-row-key']);
        return <SortableItem index={index} {...restProps} />;
    };

    render() {
        const {dataSource} = this.state;

        return (
            <Table
                pagination={false}
                dataSource={dataSource}
                columns={columns}
                rowKey="index"
                components={{
                    body: {
                        wrapper: this.DraggableContainer,
                        row: this.DraggableBodyRow,
                    },
                }}
            />
        );
    }
}

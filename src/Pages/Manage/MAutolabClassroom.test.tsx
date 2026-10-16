import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MAutolabClassroom from './MAutolabClassroom';
import autolabApi from '../../Utils/API/autolab-api';

let mockClassroom: Record<string, any>;
jest.mock('../../Utils/API/autolab-api', () => ({
  __esModule: true,
  default: {
    getClassroom: jest.fn(),
    updateClassroom: jest.fn(),
    createClassroom: jest.fn(),
    listClassroomsTable: jest.fn(),
  },
}));
jest.mock('../../Component/common/Table/TableWithPagination', () => ({
  __esModule: true,
  default: ({ columns }: any) =>
    columns
      .find((column: { title: string }) => column.title === '操作')
      .render(null, mockClassroom),
}));
jest.mock('../../Component/common/Table/TableRowDeleteButton', () => ({
  __esModule: true,
  default: () => null,
}));
// Keep the common modal's registered-field submission contract, using a real
// Ant Design Form so unregistered ext_config would disappear at validation.
jest.mock('../../Component/common/Form/ModalFormUseForm', () => {
  const React = jest.requireActual('react');
  const { Form } = jest.requireActual('antd');
  return {
    __esModule: true,
    default: function ModalFixture(props: any) {
      const [open, setOpen] = React.useState(false);
      const [loaded, setLoaded] = React.useState(undefined);
      const [form] = Form.useForm();
      React.useEffect(() => {
        if (open) {
          form.resetFields();
          form.setFieldsValue(loaded ?? {});
        }
      }, [open, loaded, form]);
      return (
        <>
          <button
            onClick={async () => {
              setLoaded(props.dataLoader ? await props.dataLoader() : undefined);
              setOpen(true);
            }}
          >
            {props.title}
          </button>
          {open && (
            <Form
              form={form}
              onFinish={(values: any) => props.dataSubmitter(values).then(() => setOpen(false))}
            >
              {props.subForm.map((subForm: any, index: number) => (
                <React.Fragment key={index}>{subForm.component}</React.Fragment>
              ))}
              <button type="submit">Save classroom</button>
            </Form>
          )}
        </>
      );
    },
  };
});

beforeEach(() => {
  mockClassroom = {
    c_id: 7,
    c_name: 'Fixture room',
    address: 'Fixture building',
    c_seat_num: 20,
    ext_config: {
      'seat-ban': [{ seat_number: 2, reason: 'broken' }],
      disabled_seats: [2, 5],
      projector: { enabled: true },
      notes: 'Preserve this field',
    },
  };
  jest
    .mocked(autolabApi.getClassroom)
    .mockReset()
    .mockImplementation(async () => mockClassroom);
  jest
    .mocked(autolabApi.updateClassroom)
    .mockReset()
    .mockImplementation(async (_id, payload) => {
      mockClassroom = { ...mockClassroom, ...payload };
    });
  jest.mocked(autolabApi.createClassroom).mockReset().mockResolvedValue(undefined);
});

async function openEditor() {
  await act(async () =>
    fireEvent.click(screen.getByRole('button', { name: '编辑教室：Fixture room' })),
  );
  return screen.getByLabelText('禁用座位（每行：座位号|原因，可仅填座位号）');
}
async function save() {
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Save classroom' })));
  await waitFor(() =>
    expect(screen.queryByRole('button', { name: 'Save classroom' })).not.toBeInTheDocument(),
  );
}

it('merges both seat-ban formats and retains unrelated extension config when saving', async () => {
  const original = mockClassroom.ext_config;
  render(<MAutolabClassroom />);
  expect(await openEditor()).toHaveValue('2|broken\n5');
  await save();
  expect(autolabApi.updateClassroom).toHaveBeenCalledWith(
    7,
    expect.objectContaining({
      ext_config: {
        'seat-ban': [
          { seat_number: 2, reason: 'broken' },
          { seat_number: 5, reason: '' },
        ],
        projector: { enabled: true },
        notes: 'Preserve this field',
      },
    }),
  );
  expect(original.disabled_seats).toEqual([2, 5]);
  expect(original['seat-ban']).toEqual([{ seat_number: 2, reason: 'broken' }]);
});

it('persists an explicit empty seat-ban and reads the cleared list back without legacy seats', async () => {
  render(<MAutolabClassroom />);
  fireEvent.change(await openEditor(), { target: { value: '' } });
  await save();
  expect(autolabApi.updateClassroom).toHaveBeenCalledWith(
    7,
    expect.objectContaining({
      ext_config: {
        'seat-ban': [],
        projector: { enabled: true },
        notes: 'Preserve this field',
      },
    }),
  );
  expect(await openEditor()).toHaveValue('');
  expect(mockClassroom.ext_config).not.toHaveProperty('disabled_seats');
});

it('creates a classroom with an explicit empty list when no extension config exists', async () => {
  render(<MAutolabClassroom />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: '新增教室' })));
  fireEvent.change(screen.getByLabelText('教室名称'), { target: { value: 'New fixture' } });
  fireEvent.change(screen.getByLabelText('教室地点'), { target: { value: 'Fixture building' } });
  fireEvent.change(screen.getByLabelText('座位数量'), { target: { value: '20' } });
  await save();
  expect(autolabApi.createClassroom).toHaveBeenCalledWith({
    c_name: 'New fixture',
    address: 'Fixture building',
    c_seat_num: 20,
    ext_config: { 'seat-ban': [] },
  });
});

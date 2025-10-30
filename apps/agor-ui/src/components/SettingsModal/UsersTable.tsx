import type { CreateUserInput, UpdateUserInput, User } from '@agor/core/types';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { useState } from 'react';
import { FormEmojiPickerInput } from '../EmojiPickerInput';

// Using Typography.Text directly to avoid DOM Text interface collision

interface UsersTableProps {
  users: User[];
  onCreate?: (data: CreateUserInput) => void;
  onUpdate?: (userId: string, updates: UpdateUserInput) => void;
  onDelete?: (userId: string) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({ users, onCreate, onUpdate, onDelete }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();

  const handleDelete = (userId: string) => {
    onDelete?.(userId);
  };

  const handleCreate = () => {
    form.validateFields().then(values => {
      onCreate?.({
        email: values.email,
        password: values.password,
        name: values.name,
        emoji: values.emoji || '👤',
        role: values.role || 'member',
      });
      form.resetFields();
      setCreateModalOpen(false);
    });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      email: user.email,
      name: user.name,
      emoji: user.emoji,
      role: user.role,
    });
    setEditModalOpen(true);
  };

  const handleUpdate = () => {
    if (!editingUser) return;

    // Validate only non-password fields (password is optional in edit mode)
    form
      .validateFields(['email', 'name', 'emoji', 'role'])
      .then(() => {
        const values = form.getFieldsValue();
        const updates: UpdateUserInput = {
          email: values.email,
          name: values.name,
          emoji: values.emoji,
          role: values.role,
        };
        // Only include password if it was provided
        if (values.password?.trim()) {
          updates.password = values.password;
        }
        onUpdate?.(editingUser.user_id, updates);
        form.resetFields();
        setEditModalOpen(false);
        setEditingUser(null);
      })
      .catch(err => {
        console.error('Validation failed:', err);
      });
  };

  const getRoleColor = (role: User['role']) => {
    switch (role) {
      case 'owner':
        return 'purple';
      case 'admin':
        return 'red';
      case 'member':
        return 'blue';
      case 'viewer':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'User',
      dataIndex: 'email',
      key: 'email',
      render: (email: string, user: User) => (
        <Space>
          <span style={{ fontSize: 20 }}>{user.emoji || '👤'}</span>
          <span>{email}</span>
        </Space>
      ),
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Typography.Text>{name || '—'}</Typography.Text>,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      width: 120,
      render: (role: User['role']) => <Tag color={getRoleColor(role)}>{role.toUpperCase()}</Tag>,
    },
    {
      title: 'Created',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (date: Date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: unknown, user: User) => (
        <Space size="small">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(user)}
          />
          <Popconfirm
            title="Delete user?"
            description={`Are you sure you want to delete user "${user.email}"?`}
            onConfirm={() => handleDelete(user.user_id)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography.Text type="secondary">Manage user accounts and permissions.</Typography.Text>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          New User
        </Button>
      </div>

      <Table
        dataSource={users}
        columns={columns}
        rowKey="user_id"
        pagination={false}
        size="small"
      />

      {/* Create User Modal */}
      <Modal
        title="Create User"
        open={createModalOpen}
        onOk={handleCreate}
        onCancel={() => {
          form.resetFields();
          setCreateModalOpen(false);
        }}
        okText="Create"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Name" style={{ marginBottom: 24 }}>
            <Flex gap={8}>
              <Form.Item name="emoji" initialValue="👤" noStyle>
                <FormEmojiPickerInput form={form} fieldName="emoji" defaultEmoji="👤" />
              </Form.Item>
              <Form.Item name="name" noStyle style={{ flex: 1 }}>
                <Input placeholder="John Doe" style={{ flex: 1 }} />
              </Form.Item>
            </Flex>
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter an email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: 'Please enter a password' },
              { min: 8, message: 'Password must be at least 8 characters' },
            ]}
          >
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            initialValue="member"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Select.Option value="owner">Owner</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        title="Edit User"
        open={editModalOpen}
        onOk={handleUpdate}
        onCancel={() => {
          form.resetFields();
          setEditModalOpen(false);
          setEditingUser(null);
        }}
        okText="Save"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Name" style={{ marginBottom: 24 }}>
            <Flex gap={8}>
              <Form.Item name="emoji" noStyle>
                <FormEmojiPickerInput form={form} fieldName="emoji" defaultEmoji="👤" />
              </Form.Item>
              <Form.Item name="name" noStyle style={{ flex: 1 }}>
                <Input placeholder="John Doe" style={{ flex: 1 }} />
              </Form.Item>
            </Flex>
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Please enter an email' },
              { type: 'email', message: 'Please enter a valid email' },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item label="Password" name="password" help="Leave blank to keep current password">
            <Input.Password placeholder="••••••••" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role"
            rules={[{ required: true, message: 'Please select a role' }]}
          >
            <Select>
              <Select.Option value="owner">Owner</Select.Option>
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="member">Member</Select.Option>
              <Select.Option value="viewer">Viewer</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

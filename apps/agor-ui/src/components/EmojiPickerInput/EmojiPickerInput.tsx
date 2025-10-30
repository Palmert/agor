import { SmileOutlined } from '@ant-design/icons';
import { Button, Form, Input, Popover } from 'antd';
import EmojiPicker, { type EmojiClickData, Theme } from 'emoji-picker-react';
import { useState } from 'react';

interface EmojiPickerInputProps {
  value?: string;
  onChange?: (value: string) => void;
  defaultEmoji?: string;
  placeholder?: string;
}

/**
 * Reusable emoji picker input component for forms
 * Displays selected emoji with a button to open picker
 */
export const EmojiPickerInput: React.FC<EmojiPickerInputProps> = ({
  value,
  onChange,
  defaultEmoji = '📋',
  placeholder,
}) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    onChange?.(emojiData.emoji);
    setPickerOpen(false);
  };

  return (
    <Input.Group compact style={{ display: 'flex', alignItems: 'stretch' }}>
      <Input
        prefix={<span style={{ fontSize: 20 }}>{value || defaultEmoji}</span>}
        readOnly
        placeholder={placeholder}
        style={{ cursor: 'default', width: 80, flex: '0 0 80px' }}
      />
      <Popover
        content={
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.DARK}
            width={350}
            height={400}
          />
        }
        trigger="click"
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        placement="right"
      >
        <Button icon={<SmileOutlined />} style={{ flex: '0 0 auto' }} />
      </Popover>
    </Input.Group>
  );
};

/**
 * Form.Item wrapper that integrates with Ant Design forms
 * Use this with Form.Item and it will handle value/onChange automatically
 */
export const FormEmojiPickerInput: React.FC<{
  form: ReturnType<typeof Form.useForm>[0];
  fieldName: string;
  defaultEmoji?: string;
}> = ({ form, fieldName, defaultEmoji }) => {
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    form.setFieldValue(fieldName, emojiData.emoji);
    setPickerOpen(false);
  };

  return (
    <div style={{ display: 'flex', gap: 0 }}>
      <Form.Item noStyle shouldUpdate>
        {() => (
          <Input
            prefix={
              <span style={{ fontSize: 14 }}>
                {form.getFieldValue(fieldName) || defaultEmoji || '📋'}
              </span>
            }
            readOnly
            style={{
              cursor: 'default',
              width: 40,
              borderTopRightRadius: 0,
              borderBottomRightRadius: 0,
            }}
          />
        )}
      </Form.Item>
      <Popover
        content={
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            theme={Theme.DARK}
            width={350}
            height={400}
          />
        }
        trigger="click"
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        placement="right"
      >
        <Button
          icon={<SmileOutlined />}
          style={{
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderLeft: 'none',
          }}
        />
      </Popover>
    </div>
  );
};

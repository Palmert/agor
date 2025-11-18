import type { ApiKeyConfig, ApiKeyName } from '@agor/core/config';
import { API_KEYS } from '@agor/core/config';
import { CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { Button, Input, Space, Tag, Typography, theme } from 'antd';
import { useState } from 'react';

const { Text, Link } = Typography;

export interface ApiKeyStatus {
  ANTHROPIC_API_KEY: boolean;
  OPENAI_API_KEY: boolean;
  GEMINI_API_KEY: boolean;
}

export interface ApiKeyFieldsProps {
  /** Current status of each key (true = set, false = not set). Can be a partial set of keys. */
  keyStatus: Partial<ApiKeyStatus>;
  /** Callback when user saves a new key */
  onSave: (field: keyof ApiKeyStatus, value: string) => Promise<void>;
  /** Callback when user clears a key */
  onClear: (field: keyof ApiKeyStatus) => Promise<void>;
  /** Loading state for save/clear operations */
  saving?: Record<string, boolean>;
  /** Disable all fields */
  disabled?: boolean;
}

// Use core API_KEYS registry (single source of truth)
const KEY_CONFIGS: ApiKeyConfig[] = Object.values(API_KEYS);

export const ApiKeyFields: React.FC<ApiKeyFieldsProps> = ({
  keyStatus,
  onSave,
  onClear,
  saving = {},
  disabled = false,
}) => {
  const { token } = theme.useToken();
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  const handleSave = async (field: keyof ApiKeyStatus) => {
    const value = inputValues[field]?.trim();
    if (!value) return;

    await onSave(field, value);
    setInputValues(prev => ({ ...prev, [field]: '' }));
  };

  const renderKeyField = (config: ApiKeyConfig) => {
    const { keyName, label, description, placeholder, docUrl } = config;
    const isSet = keyStatus[keyName as ApiKeyName];

    return (
      <div key={keyName} style={{ marginBottom: token.marginLG }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Space>
            <Text strong>{label}</Text>
            {description && <Text type="secondary">{description}</Text>}
            {isSet ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Set
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="default">
                Not Set
              </Tag>
            )}
          </Space>

          {isSet ? (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => onClear(keyName as keyof ApiKeyStatus)}
              loading={saving[keyName]}
              disabled={disabled}
            >
              Clear Key
            </Button>
          ) : (
            <Space.Compact style={{ width: '100%' }}>
              <Input.Password
                placeholder={placeholder}
                value={inputValues[keyName] || ''}
                onChange={e => setInputValues(prev => ({ ...prev, [keyName]: e.target.value }))}
                onPressEnter={() => handleSave(keyName)}
                style={{ flex: 1 }}
                disabled={disabled}
              />
              <Button
                type="primary"
                onClick={() => handleSave(keyName as keyof ApiKeyStatus)}
                loading={saving[keyName]}
                disabled={disabled || !inputValues[keyName]?.trim()}
              >
                Save
              </Button>
            </Space.Compact>
          )}

          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            Get your key at:{' '}
            <Link href={docUrl} target="_blank">
              {docUrl}
            </Link>
          </Text>
        </Space>
      </div>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {KEY_CONFIGS.filter((config): config is ApiKeyConfig => config.keyName in keyStatus).map(
        config => renderKeyField(config)
      )}
    </Space>
  );
};

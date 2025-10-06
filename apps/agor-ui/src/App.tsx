import { Alert, ConfigProvider, message, Spin, theme } from 'antd';
import { App as AgorApp } from './components/App';
import { useAgorClient, useAgorData, useSessionActions } from './hooks';
import { mockAgents } from './mocks';
import './App.css';

function App() {
  // Connect to daemon
  const { client, connected, connecting, error: connectionError } = useAgorClient();

  // Fetch data
  const { sessions, tasks, boards, loading, error: dataError } = useAgorData(client);

  // Session actions
  const { createSession, forkSession, spawnSession, updateSession, deleteSession } =
    useSessionActions(client);

  // Show connection error
  if (connectionError) {
    return (
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <Alert
            type="error"
            message="Failed to connect to Agor daemon"
            description={
              <div>
                <p>{connectionError}</p>
                <p>
                  Start the daemon with: <code>cd apps/agor-daemon && pnpm dev</code>
                </p>
              </div>
            }
            showIcon
          />
        </div>
      </ConfigProvider>
    );
  }

  // Show loading state
  if (connecting || loading) {
    return (
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Spin size="large" tip="Connecting to daemon..." />
        </div>
      </ConfigProvider>
    );
  }

  // Show data error
  if (dataError) {
    return (
      <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
        <div
          style={{
            height: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
          }}
        >
          <Alert type="error" message="Failed to load data" description={dataError} showIcon />
        </div>
      </ConfigProvider>
    );
  }

  // Handle session creation
  const handleCreateSession = async (
    config: Parameters<React.ComponentProps<typeof AgorApp>['onCreateSession']>[0]
  ) => {
    const session = await createSession(config);
    if (session) {
      message.success('Session created successfully!');
    } else {
      message.error('Failed to create session');
    }
  };

  // Handle fork session
  const handleForkSession = async (sessionId: string, prompt: string) => {
    const session = await forkSession(sessionId as import('@agor/core/types').SessionID, prompt);
    if (session) {
      message.success('Session forked successfully!');
    } else {
      message.error('Failed to fork session');
    }
  };

  // Handle spawn session
  const handleSpawnSession = async (sessionId: string, prompt: string) => {
    const session = await spawnSession(sessionId as import('@agor/core/types').SessionID, prompt);
    if (session) {
      message.success('Subtask session spawned successfully!');
    } else {
      message.error('Failed to spawn session');
    }
  };

  // Handle send prompt (placeholder for future agent integration)
  const handleSendPrompt = async (sessionId: string, prompt: string) => {
    message.info('Agent integration not yet implemented. Prompt logged to console.');
    console.log('Send prompt to session:', sessionId, prompt);
  };

  // Handle update session
  const handleUpdateSession = async (
    sessionId: string,
    updates: Partial<import('@agor/core/types').Session>
  ) => {
    const session = await updateSession(sessionId as import('@agor/core/types').SessionID, updates);
    if (session) {
      message.success('Session updated successfully!');
    } else {
      message.error('Failed to update session');
    }
  };

  // Handle delete session
  const handleDeleteSession = async (sessionId: string) => {
    const success = await deleteSession(sessionId as import('@agor/core/types').SessionID);
    if (success) {
      message.success('Session deleted successfully!');
    } else {
      message.error('Failed to delete session');
    }
  };

  // Render main app
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
      <AgorApp
        sessions={sessions}
        tasks={tasks}
        availableAgents={mockAgents}
        boards={boards}
        onCreateSession={handleCreateSession}
        onForkSession={handleForkSession}
        onSpawnSession={handleSpawnSession}
        onSendPrompt={handleSendPrompt}
        onUpdateSession={handleUpdateSession}
        onDeleteSession={handleDeleteSession}
        onSettingsClick={() => console.log('Settings clicked')}
      />
    </ConfigProvider>
  );
}

export default App;

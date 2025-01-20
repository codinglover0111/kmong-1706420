import { logLevel } from '@renderer/utils/types'

interface UseLoggerParams {
  level: logLevel
  msg: string
}

interface UseLoggerReturn {
  sendLog: () => void
}

export const useLogger = ({ level, msg }: UseLoggerParams): UseLoggerReturn => {
  const sendLog = (): void => {
    window.electron.ipcRenderer.send('log', level, msg)
  }

  return { sendLog }
}

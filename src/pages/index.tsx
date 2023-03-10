/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect, useMemo } from 'react'

import useSound from 'use-sound'
import {
  type Activity,
  useCurrentActivity,
  useIsTimerActive,
  useTimerActions,
  useTimer,
} from '@/timer-store'
import { Header } from '@/header'
import { activityCount, useSettingsActions } from '@/settings-store'
import { api } from '@/utils/api'

const bubbleSfx = '../../audio/bubble.mp3'
const toggleTimerSfx = '../../audio/toggle-timer.mp3'

export const timerUtils = {
  formatTime: (time: number) => {
    const addZeroBefore = (time: number) => ('0' + time.toString()).slice(-2)
    const seconds = Math.floor(time / 1000) % 60
    const minutes = Math.floor(time / 1000 / 60)

    return `${addZeroBefore(minutes)}:${addZeroBefore(seconds)}`
  },
}

export default function Pomodoro() {
  const timer = useTimer()
  const isTimerActive = useIsTimerActive()
  const timerActions = useTimerActions()
  const settingsActions = useSettingsActions()

  const userSettings = api.userSettings.get.useQuery()
  const updateActivityCount = api.userSettings.updateActivityCount.useMutation()

  useMemo(() => {
    if (userSettings.data) {
      settingsActions.setSettings(userSettings.data)
      timerActions.setTimer(userSettings.data.pomodoroTime)
    }
  }, [settingsActions, timerActions, userSettings.data])

  const [playAlarmSound] = useSound(bubbleSfx, {
    volume: 0.05,
  })
  const [playToggleTimerSound] = useSound(toggleTimerSfx, {
    volume: 0.01,
  })

  useEffect(() => {
    if (isTimerActive) {
      const countdownInterval = setInterval(timerActions.countdown, 1000)

      if (timer === 0) {
        clearInterval(countdownInterval)
        timerActions.toggleTimer()
        timerActions.decideNextActivity()
        playAlarmSound()
        updateActivityCount.mutate(
          { field: 'pomodoroCount' },
          {
            onSuccess: () => {
              userSettings.refetch()
            },
          },
        )
      }
      return () => {
        clearInterval(countdownInterval)
      }
    }
  }, [timer, isTimerActive, playAlarmSound, timerActions, updateActivityCount])

  return (
    <>
      <Header />

      <div className='mt-40 flex justify-center'>
        <div className='text-center'>
          <div className='flex flex-col content-center items-center justify-between gap-16 rounded-2xl bg-[#183752] py-10 px-20'>
            <div className='flex items-center gap-4'>
              <ActivityButton activity='pomodoro' label='Pomodoro' />
              <ActivityButton activity='shortBreak' label='Short Break' />
              <ActivityButton activity='longBreak' label='Long Break' />
            </div>

            <h1 className='text-9xl font-bold'>
              {timerUtils.formatTime(timer)}
            </h1>

            <button
              className='w-9/12 rounded-lg border-2 border-[#E5DCB4] px-8 py-6 text-3xl font-bold text-[#E5DCB4] hover:bg-[#E5DCB4] hover:text-[#183752]'
              onClick={() => {
                timerActions.toggleTimer()
                playToggleTimerSound()
              }}
            >
              {isTimerActive ? 'Pause' : 'Start'}
            </button>
          </div>
          <p className='mt-6 text-xl text-gray-400'>#{activityCount()}</p>
        </div>
      </div>
    </>
  )
}

const ActivityButton = (props: { label: string; activity: Activity }) => {
  const currentActivity = useCurrentActivity()
  const timerActions = useTimerActions()

  return (
    <button
      className={`rounded-2xl py-3 px-6 text-lg font-bold ${
        props.activity === currentActivity
          ? 'bg-[#E5DCB4] text-[#183752]'
          : 'hover:bg-gray-800'
      }`}
      onClick={() => timerActions.switchActivity(props.activity)}
    >
      {props.label}
    </button>
  )
}

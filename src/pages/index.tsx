import { type GetServerSideProps } from 'next'
import { useState } from 'react'
import { getServerSession } from 'next-auth'
import { signIn } from 'next-auth/react'
import { authOptions } from '@/server/auth'
import { prisma } from '@/server/db'
import { type Timer } from '@prisma/client'

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions)

  const timerSettings = await prisma.timer.findFirst({
    where: {
      user_id: session?.user.id,
    },
    select: {
      pomodoro_time: true,
      short_break_time: true,
      long_break_time: true,
      pomodoro_count: true,
      short_break_count: true,
      long_break_count: true,
      auto_start_pomodoros: true,
      auto_start_breaks: true,
      long_break_interval: true,
    },
  })

  return {
    props: { timerSettings },
  }
}

export default function Pomodoro({ timerSettings }: { timerSettings: Timer }) {
  const [timer, setTimer] = useState(timerSettings.pomodoro_time)

  setInterval(() => {
    // setTimer((timer) => (timer = timer + 1000))
  }, 1000)

  const formatTimer = () => {
    const seconds = Math.floor(timer / 1000) % 60
    const minutes = Math.floor(timer / 1000 / 60)

    return `${addZeroBefore(minutes)}:${addZeroBefore(seconds)}`
  }

  const addZeroBefore = (time: number) => ('0' + time.toString()).slice(-2)

  formatTimer()

  return (
    <div className='mt-40 flex justify-center'>
      <button onClick={() => signIn('google', { callbackUrl: '/' })}>
        Sign in
      </button>

      <div className='text-center'>
        <div className='flex flex-col content-center items-center justify-between gap-12 rounded-2xl bg-[#312e45] py-8 px-16'>
          <div className='flex items-center gap-4'>
            <ActivityButton label='Pomodoro' current />
            <ActivityButton label='Short Break' />
            <ActivityButton label='Long Break' />
          </div>

          <h1 className='text-9xl font-bold'>{formatTimer()}</h1>

          <button className='w-3/6 rounded-lg bg-white px-8 py-4 text-2xl font-bold text-sky-500'>
            START
          </button>
        </div>
        <p className='mt-6 text-xl text-gray-400'>#1</p>
      </div>
    </div>
  )
}

const ActivityButton = (props: { label: string; current?: boolean }) => (
  <button
    className={`rounded-2xl py-3 px-6 ${
      !!props.current ? 'bg-sky-900 ' : 'hover:bg-gray-700'
    }`}
  >
    {props.label}
  </button>
)

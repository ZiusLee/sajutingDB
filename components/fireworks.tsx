"use client"

import { useEffect, useRef } from "react"

interface FireworkParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  decay: number
}

export function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const fireworksRef = useRef<FireworkParticle[]>([])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 캔버스 크기를 창 크기에 맞게 설정
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // 랜덤 색상 생성
    const getRandomColor = () => {
      const colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080"]
      return colors[Math.floor(Math.random() * colors.length)]
    }

    // 폭죽 생성
    const createFirework = (x: number, y: number) => {
      const particleCount = 80 + Math.floor(Math.random() * 50)
      const color = getRandomColor()

      for (let i = 0; i < particleCount; i++) {
        const angle = Math.PI * 2 * Math.random()
        const speed = 1 + Math.random() * 5

        fireworksRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: 1 + Math.random() * 2,
          color,
          alpha: 1,
          decay: 0.015 + Math.random() * 0.01,
        })
      }
    }

    // 랜덤 위치에 폭죽 생성
    const createRandomFirework = () => {
      const x = Math.random() * canvas.width
      const y = Math.random() * (canvas.height * 0.6) // 상단 60%에만 생성
      createFirework(x, y)
    }

    // 초기 폭죽 생성
    for (let i = 0; i < 3; i++) {
      createRandomFirework()
    }

    // 주기적으로 새 폭죽 생성
    const fireworkInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        // 70% 확률로 생성
        createRandomFirework()
      }
    }, 800)

    // 애니메이션 함수
    const animate = () => {
      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.globalCompositeOperation = "lighter"

      // 모든 파티클 업데이트 및 그리기
      fireworksRef.current.forEach((particle, index) => {
        particle.x += particle.vx
        particle.y += particle.vy
        particle.vy += 0.02 // 중력
        particle.alpha -= particle.decay

        if (particle.alpha <= 0) {
          fireworksRef.current.splice(index, 1)
          return
        }

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
        ctx.closePath()
        ctx.fillStyle = `rgba(${Number.parseInt(particle.color.slice(1, 3), 16)}, ${Number.parseInt(particle.color.slice(3, 5), 16)}, ${Number.parseInt(particle.color.slice(5, 7), 16)}, ${particle.alpha})`
        ctx.fill()
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    // 애니메이션 시작
    animationRef.current = requestAnimationFrame(animate)

    // 클린업 함수
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      clearInterval(fireworkInterval)
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  return (
    <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" style={{ background: "transparent" }} />
  )
}

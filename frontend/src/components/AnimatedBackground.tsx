import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Box } from '@chakra-ui/react'

interface Node {
  id: number
  x: number
  y: number
  vx: number
  vy: number
}

interface Connection {
  from: Node
  to: Node
  distance: number
}

const AnimatedBackground = () => {
  const [nodes, setNodes] = useState<Node[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // 初始化节点
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)

    // 创建节点
    const initialNodes: Node[] = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.8
    }))

    setNodes(initialNodes)

    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // 动画循环
  useEffect(() => {
    if (nodes.length === 0) return

    const animate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(node => {
          let newX = node.x + node.vx
          let newY = node.y + node.vy
          let newVx = node.vx
          let newVy = node.vy

          // 边界反弹
          if (newX <= 0 || newX >= dimensions.width) {
            newVx = -newVx
            newX = Math.max(0, Math.min(dimensions.width, newX))
          }
          if (newY <= 0 || newY >= dimensions.height) {
            newVy = -newVy
            newY = Math.max(0, Math.min(dimensions.height, newY))
          }

          return {
            ...node,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy
          }
        })

        // 计算连接
        const newConnections: Connection[] = []
        const maxDistance = 180

        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[i].x - newNodes[j].x
            const dy = newNodes[i].y - newNodes[j].y
            const distance = Math.sqrt(dx * dx + dy * dy)

            if (distance < maxDistance) {
              newConnections.push({
                from: newNodes[i],
                to: newNodes[j],
                distance
              })
            }
          }
        }

        setConnections(newConnections)
        return newNodes
      })
    }

    const intervalId = setInterval(animate, 50)
    return () => clearInterval(intervalId)
  }, [nodes.length, dimensions])

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      width="100vw"
      height="100vh"
      zIndex={0}
      overflow="hidden"
      bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    >
      {/* 背景粒子效果 */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          style={{
            position: 'absolute',
            width: '2px',
            height: '2px',
            backgroundColor: 'rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.8, 0.3]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}

      {/* SVG 连接线和节点 */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* 连接线 */}
        {connections.map((connection, i) => {
          const opacity = Math.max(0, 1 - connection.distance / 180)
          return (
            <motion.line
              key={`connection-${i}`}
              x1={connection.from.x}
              y1={connection.from.y}
              x2={connection.to.x}
              y2={connection.to.y}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={1}
              initial={{ opacity: 0 }}
              animate={{ opacity }}
              transition={{ duration: 0.3 }}
            />
          )
        })}

        {/* 节点 */}
        {nodes.map((node) => (
          <motion.circle
            key={`node-${node.id}`}
            cx={node.x}
            cy={node.y}
            r={3}
            fill="rgba(255, 255, 255, 0.8)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.5, fill: "rgba(255, 255, 255, 1)" }}
            transition={{ duration: 0.3 }}
          />
        ))}
      </svg>

      {/* 几何图形装饰 - 莫比乌斯环组合 */}
      {/* 主圆环 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '120px',
          height: '120px',
          border: '3px solid rgba(255, 255, 255, 0.3)',
          borderRadius: '50%'
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1]
        }}
        transition={{
          rotate: { duration: 25, repeat: Infinity, ease: 'linear' },
          scale: { duration: 5, repeat: Infinity }
        }}
      />
      
      {/* 内嵌圆环 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '22%',
          right: '12%',
          width: '80px',
          height: '80px',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '50%'
        }}
        animate={{
          rotate: -360,
          scale: [1, 0.8, 1]
        }}
        transition={{
          rotate: { duration: 18, repeat: Infinity, ease: 'linear' },
          scale: { duration: 3, repeat: Infinity }
        }}
      />
      
      {/* 交叉圆环1 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '18%',
          right: '8%',
          width: '60px',
          height: '100px',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '50%',
          transform: 'rotate(45deg)'
        }}
        animate={{
          rotate: [45, 405],
          scale: [1, 1.1, 1]
        }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
          scale: { duration: 6, repeat: Infinity }
        }}
      />
      
      {/* 交叉圆环2 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '22%',
          right: '14%',
          width: '100px',
          height: '60px',
          border: '2px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '50%',
          transform: 'rotate(-45deg)'
        }}
        animate={{
          rotate: [-45, -405],
          scale: [1, 0.9, 1]
        }}
        transition={{
          rotate: { duration: 22, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity }
        }}
      />

      {/* 左侧莫比乌斯环组合 */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '25%',
          left: '12%',
          width: '90px',
          height: '90px',
          border: '2px solid rgba(255, 255, 255, 0.3)'
        }}
        animate={{
          rotate: -360,
          x: [0, 15, 0],
          y: [0, -8, 0]
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          x: { duration: 8, repeat: Infinity },
          y: { duration: 6, repeat: Infinity }
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          bottom: '27%',
          left: '14%',
          width: '50px',
          height: '50px',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          borderRadius: '50%'
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.3, 1]
        }}
        transition={{
          rotate: { duration: 12, repeat: Infinity, ease: 'linear' },
          scale: { duration: 3, repeat: Infinity }
        }}
      />
      
      {/* 中央莫比乌斯环 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '45%',
          left: '50%',
          width: '150px',
          height: '80px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          transform: 'translateX(-50%)'
        }}
        animate={{
          rotate: [0, 180, 360],
          scaleX: [1, 0.5, 1],
          scaleY: [1, 1.5, 1]
        }}
        transition={{
          rotate: { duration: 35, repeat: Infinity, ease: 'linear' },
          scaleX: { duration: 8, repeat: Infinity },
          scaleY: { duration: 10, repeat: Infinity }
        }}
      />
      
      <motion.div
        style={{
          position: 'absolute',
          top: '47%',
          left: '50%',
          width: '80px',
          height: '150px',
          border: '2px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '50%',
          transform: 'translateX(-50%)'
        }}
        animate={{
          rotate: [0, -180, -360],
          scaleX: [1, 1.5, 1],
          scaleY: [1, 0.5, 1]
        }}
        transition={{
          rotate: { duration: 28, repeat: Infinity, ease: 'linear' },
          scaleX: { duration: 12, repeat: Infinity },
          scaleY: { duration: 7, repeat: Infinity }
        }}
      />

      {/* 人机协同主题的图标动画 */}
      <motion.div
        style={{
          position: 'absolute',
          top: '15%',
          left: '20%',
          fontSize: '24px',
          color: 'rgba(255, 255, 255, 0.3)'
        }}
        animate={{
          y: [0, -10, 0],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: 1
        }}
      >
        🤖
      </motion.div>

      <motion.div
        style={{
          position: 'absolute',
          bottom: '25%',
          right: '25%',
          fontSize: '24px',
          color: 'rgba(255, 255, 255, 0.3)'
        }}
        animate={{
          y: [0, 10, 0],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          delay: 0.5
        }}
      >
        👤
      </motion.div>
    </Box>
  )
}

export default AnimatedBackground
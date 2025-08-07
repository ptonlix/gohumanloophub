import {
  Button,
} from "@chakra-ui/react"
import { FiEye } from "react-icons/fi"
import { Link } from "@tanstack/react-router"

interface TaskDetailProps {
  task: any
}

const TaskDetail = ({ task }: TaskDetailProps) => {
  return (
    <Link to="/taskdetail/$taskId" params={{ taskId: task.task_id }} target="_blank">
      <Button variant="ghost" size="sm" colorPalette="blue">
        <FiEye fontSize="16px" />
        查看详情
      </Button>
    </Link>
  )
}

export default TaskDetail
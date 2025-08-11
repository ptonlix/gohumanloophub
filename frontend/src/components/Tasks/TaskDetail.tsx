import {
  Button,
} from "@chakra-ui/react"
import { FiEye } from "react-icons/fi"
import { Link } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

interface TaskDetailProps {
  task: any
}

const TaskDetail = ({ task }: TaskDetailProps) => {
  const { t } = useTranslation()
  return (
    <Link to="/taskdetail/$taskId" params={{ taskId: task.task_id }} target="_blank">
      <Button variant="ghost" size="sm" colorPalette="blue">
        <FiEye fontSize="16px" />
        {t("tasks.viewDetails")}
      </Button>
    </Link>
  )
}

export default TaskDetail

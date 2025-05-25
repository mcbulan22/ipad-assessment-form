import StudentAcknowledgment from "@/components/student-acknowledgment"

interface PageProps {
  params: {
    id: string
  }
}

export default function AcknowledgePage({ params }: PageProps) {
  return <StudentAcknowledgment assessmentId={params.id} />
}

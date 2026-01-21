import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LocalTime } from '@/components/LocalTime'
import { Lock, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE = 25

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function FeedPage({ searchParams }: Props) {
  const { page } = await searchParams
  const currentPage = Math.max(1, parseInt(page || '1', 10))
  const offset = (currentPage - 1) * PAGE_SIZE

  const supabase = await createClient()

  // Get total count for pagination
  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('is_public', true)
    .eq('revealed', false)

  const totalPages = Math.ceil((count || 0) / PAGE_SIZE)

  // Get paginated questions
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_public', true)
    .eq('revealed', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (error) {
    console.error('Error fetching public questions:', error)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Public Questions</h1>
        <p className="mt-2 text-muted-foreground">
          Browse and guess on questions from the community.
        </p>
      </div>

      {!questions || questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No public questions yet.</p>
            <Link
              href="/new"
              className="mt-4 inline-block text-primary hover:text-accent"
            >
              Create the first one
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-6">
            {questions.map((question) => (
              <Link key={question.id} href={`/q/${question.id.slice(0, 7)}`} className="block">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg">{question.title}</CardTitle>
                        {question.description && (
                          <CardDescription className="mt-1 line-clamp-2">
                            {question.description}
                          </CardDescription>
                        )}
                      </div>
                      {question.password && (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                    {question.created_at && (
                      <p className="text-xs text-muted-foreground pt-2">
                        <LocalTime date={question.created_at} />
                      </p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={currentPage <= 1}
              >
                <Link
                  href={currentPage > 1 ? `/feed?page=${currentPage - 1}` : '#'}
                  className={currentPage <= 1 ? 'pointer-events-none opacity-50' : ''}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Link>
              </Button>

              <span className="px-4 text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                asChild
                disabled={currentPage >= totalPages}
              >
                <Link
                  href={currentPage < totalPages ? `/feed?page=${currentPage + 1}` : '#'}
                  className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : ''}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

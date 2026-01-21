import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { LocalTime } from '@/components/LocalTime'
import { Lock } from 'lucide-react'

export default async function FeedPage() {
  const supabase = await createClient()

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('is_public', true)
    .eq('revealed', false)
    .order('created_at', { ascending: false })

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
        <div className="space-y-4">
          {questions.map((question) => (
            <Link key={question.id} href={`/q/${question.slug}`}>
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
                  <p className="text-xs text-muted-foreground pt-2">
                    <LocalTime date={question.created_at} />
                  </p>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

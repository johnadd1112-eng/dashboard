async function testAISummarizer() {
    const youtubeUrl = "https://www.youtube.com/watch?v=8KkKuTCFvzI"
    const manualTranscript = `Imagine you're a procrastinator. You have a monster in your head called the Instant Gratification Monkey. 
    He wants to do things that are easy and fun. But you also have a Rational Decision Maker who wants to do productive things.
    When a deadline approaches, the Panic Monster wakes up and scares the Monkey away, allowing you to finally work.`

    console.log(`Testing AI Summarizer with Manual Text Fallback...`)

    try {
        const response = await fetch('http://localhost:3000/api/ai/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: youtubeUrl,
                text: manualTranscript
            })
        })

        const data = await response.json()
        console.log('Status:', response.status)

        if (response.ok) {
            console.log('--- GENERATED SUMMARY ---')
            console.log(data.summary)
            console.log('-------------------------')
            console.log('SUCCESS: AI Summarizer (Manual Fallback) is working correctly.')
        } else {
            console.log('FAILURE:', data.error || 'Unknown error')
        }
    } catch (error) {
        console.error('CRITICAL ERROR: Could not connect to the server.', error.message)
    }
}

testAISummarizer()

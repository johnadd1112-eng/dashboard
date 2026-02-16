async function testSignup() {
    const email = `test_${Date.now()}@example.com`;
    console.log(`Testing signup with email: ${email}`);

    try {
        const response = await fetch('http://localhost:3000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: 'password123',
                name: 'Test User'
            })
        });

        const data = await response.json();
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(data, null, 2));

        if (response.ok && data.user) {
            console.log('SUCCESS: Professional validation passed. User created in database.');
        } else {
            console.log('FAILURE: Backend returned unexpected response.');
        }
    } catch (error) {
        console.error('CRITICAL ERROR: Could not connect to the server.', error.message);
    }
}

testSignup();

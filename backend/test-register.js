const axios = require('axios');

const testRegister = async () => {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/register', {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123'
        });
    } catch (error) {
        console.error('❌ Registration failed:');
        console.error('Status:', error.response?.status);
        console.error('Message:', error.response?.data?.message || error.message);
        console.error('Full error:', error.response?.data || error);
    }
};

testRegister();

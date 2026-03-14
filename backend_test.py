#!/usr/bin/env python3

import requests
import sys
import json
from datetime import datetime

# Fix Windows console encoding for emojis
import sys
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

class BloomAPITester:
    def __init__(self, base_url="http://localhost:8000"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.test_email: str = ""
        self.test_password: str = ""

    def log_test(self, name, passed, details=""):
        """Log a test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {name}: PASSED")
        else:
            print(f"❌ {name}: FAILED - {details}")
        
        self.test_results.append({
            "test": name,
            "passed": passed,
            "details": details
        })

    def test_api_health(self):
        """Test basic API connectivity"""
        try:
            response = requests.get(f"{self.base_url}/api/", timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.log_test("API Health Check", True, f"Status: {data}")
                return True
            else:
                self.log_test("API Health Check", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Health Check", False, f"Connection error: {str(e)}")
            return False

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test_{timestamp}@bloom.test",
            "password": "test123456"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=test_user,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.test_email = test_user["email"]
                    self.test_password = test_user["password"]
                    self.log_test("User Registration", True, f"User ID: {self.user_id}")
                    return True
                else:
                    self.log_test("User Registration", False, "Missing token or user in response")
                    return False
            else:
                self.log_test("User Registration", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("User Registration", False, f"Error: {str(e)}")
            return False

    def test_user_login(self):
        """Test login with newly registered user"""
        if not self.test_email:
            self.log_test("Login User", False, "No email available for login")
            return False

        login_data = {
            "email": self.test_email, 
            "password": self.test_password
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data:
                    self.token = data["token"] 
                    self.user_id = data["user"]["id"]
                    self.log_test("Login User", True, f"User: {data['user']['email']}")
                    return True
                else:
                    self.log_test("Login User", False, "No token in response")
                    return False
            else:
                self.log_test("Login User", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Login User", False, f"Error: {str(e)}")
            return False

    def test_get_profile(self):
        """Test getting user profile"""
        if not self.token:
            self.log_test("Get User Profile", False, "No token available")
            return False

        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/api/user/profile",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data:
                    self.log_test("Get User Profile", True, f"Profile loaded for: {data['user'].get('email')}")
                    return True
                else:
                    self.log_test("Get User Profile", False, "No user data in response")
                    return False
            else:
                self.log_test("Get User Profile", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Get User Profile", False, f"Error: {str(e)}")
            return False

    def test_quiz_save(self):
        """Test saving quiz data"""
        if not self.token:
            self.log_test("Save Quiz", False, "No token available")
            return False

        quiz_data = {
            "monthly_income": 5000.0,
            "monthly_surplus": 1000.0,
            "emergency_fund": "working_on_it",
            "primary_goal": "First home",
            "risk_comfort": 3
        }

        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(
                f"{self.base_url}/api/quiz/save",
                json=quiz_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "saved":
                    self.log_test("Save Quiz", True, "Quiz data saved successfully")
                    return True
                else:
                    self.log_test("Save Quiz", False, "Unexpected response format")
                    return False
            else:
                self.log_test("Save Quiz", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Save Quiz", False, f"Error: {str(e)}")
            return False

    def test_compounding_calculation(self):
        """Test compounding calculation endpoint"""
        calc_data = {
            "monthly_amount": 1000.0,
            "years": 10,
            "rate": 7.0
        }

        try:
            response = requests.post(
                f"{self.base_url}/api/calculate/compound",
                json=calc_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and "final_balance" in data:
                    final_balance = data["final_balance"]
                    self.log_test("Compounding Calculation", True, f"Final balance: ${final_balance:,.2f}")
                    return True
                else:
                    self.log_test("Compounding Calculation", False, "Missing data in response")
                    return False
            else:
                self.log_test("Compounding Calculation", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Compounding Calculation", False, f"Error: {str(e)}")
            return False

    def test_chat_send(self):
        """Test sending chat message"""
        if not self.token:
            self.log_test("Chat Send", False, "No token available")
            return False

        chat_data = {"message": "What is compound interest?"}

        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(
                f"{self.base_url}/api/chat/send",
                json=chat_data,
                headers=headers,
                timeout=30  # Longer timeout for AI response
            )
            
            if response.status_code == 200:
                data = response.json()
                if "response" in data and data["response"]:
                    self.log_test("Chat Send", True, f"AI response received (length: {len(data['response'])} chars)")
                    return True
                else:
                    self.log_test("Chat Send", False, "No response from AI")
                    return False
            else:
                self.log_test("Chat Send", False, f"Status {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Chat Send", False, f"Error: {str(e)}")
            return False

    def test_chat_history(self):
        """Test getting chat history"""
        if not self.token:
            self.log_test("Chat History", False, "No token available")
            return False

        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/api/chat/history",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "messages" in data:
                    message_count = len(data["messages"])
                    self.log_test("Chat History", True, f"Retrieved {message_count} messages")
                    return True
                else:
                    self.log_test("Chat History", False, "No messages field in response")
                    return False
            else:
                self.log_test("Chat History", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Chat History", False, f"Error: {str(e)}")
            return False

    def test_quiz_reset(self):
        """Test quiz reset functionality"""
        if not self.token:
            self.log_test("Quiz Reset", False, "No token available")
            return False

        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.post(
                f"{self.base_url}/api/quiz/reset",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "status" in data and data["status"] == "reset":
                    self.log_test("Quiz Reset", True, "Quiz and chat history reset successfully")
                    return True
                else:
                    self.log_test("Quiz Reset", False, "Unexpected response format")
                    return False
            else:
                self.log_test("Quiz Reset", False, f"Status {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Quiz Reset", False, f"Error: {str(e)}")
            return False

    def run_all_tests(self):
        """Run comprehensive API test suite"""
        print("🚀 Starting Bloom Financial Mentor API Tests")
        print("=" * 50)
        
        # Basic connectivity
        if not self.test_api_health():
            print("\n❌ API is not accessible. Stopping tests.")
            return False
        
        # Authentication flow
        print("\n🔐 Testing Authentication...")
        auth_success = self.test_user_registration() and self.test_user_login()
        
        if not auth_success:
            print("❌ Authentication failed. Stopping tests.")
            return False
            
        # Core functionality
        print("\n📊 Testing Core Features...")
        self.test_get_profile()
        self.test_quiz_save()
        self.test_compounding_calculation()
        
        print("\n💬 Testing Chat Features...")
        self.test_chat_send()
        self.test_chat_history()
        
        print("\n🔄 Testing Quiz Management...")
        self.test_quiz_reset()
        
        # Summary
        print("\n" + "=" * 50)
        print(f"📈 Tests Complete: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️  Some tests failed. Check details above.")
            return False

def main():
    """Main test execution"""
    tester = BloomAPITester()
    success = tester.run_all_tests()
    
    # Return appropriate exit code
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
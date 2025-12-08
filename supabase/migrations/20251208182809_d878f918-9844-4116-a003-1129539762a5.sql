-- Insert sample FAQ items for the support widget
INSERT INTO public.faq_items (question, answer, category, is_published, order_index) VALUES
-- Getting Started
('What is AYN?', 'AYN is your intelligent AI companion designed to help you with daily organization, planning, and life management. It learns your habits, understands your goals, and provides personalized guidance to keep you focused and productive.', 'getting_started', true, 1),

('How do I get started with AYN?', 'Getting started is easy:\n\n1. **Create an account** using your email\n2. **Complete the tutorial** to learn the interface\n3. **Start chatting** with AYN about anything you need help with\n\nAYN will learn from your interactions and become more helpful over time.', 'getting_started', true, 2),

('Is AYN free to use?', 'AYN offers a free tier with limited monthly usage. For unlimited access and premium features, you can upgrade to one of our paid plans. Visit your account settings to see available options.', 'getting_started', true, 3),

-- Features
('What AI modes are available?', 'AYN offers several specialized modes:\n\n- **Business Mode** - Strategic planning and analysis\n- **Medical Mode** - Health information and guidance\n- **Legal Mode** - Legal document analysis\n- **PDF Analysis** - Extract insights from documents\n- **Vision Mode** - Image understanding\n- **Civil Engineering** - Technical calculations\n\nSwitch between modes using the selector in the chat interface.', 'features', true, 4),

('Can I upload files to AYN?', 'Yes! AYN supports file uploads including:\n\n- **PDFs** for document analysis\n- **Images** for visual understanding\n- **Text files** for content review\n\nSimply drag and drop files into the chat or click the attachment button.', 'features', true, 5),

('How does AYN remember our conversations?', 'AYN maintains conversation history within each chat session. You can:\n\n- View past messages in the transcript sidebar\n- Start new conversations anytime\n- Pin important chats for quick access\n\nYour privacy is protected - you control what data is stored.', 'features', true, 6),

-- Account & Security
('How do I change my password?', 'To change your password:\n\n1. Go to **Settings** from the profile menu\n2. Select **Account Preferences**\n3. Click **Change Password**\n4. Enter your current password and new password\n5. Click **Update Password**', 'account', true, 7),

('Is my data secure with AYN?', 'Yes, we take security seriously:\n\n- **End-to-end encryption** for all communications\n- **Row-level security** on all database tables\n- **Automatic session timeout** after 30 minutes of inactivity\n- **Device tracking** to detect unauthorized access\n\nYour data is never shared with third parties.', 'account', true, 8),

('How do I delete my account?', 'To delete your account:\n\n1. Go to **Settings**\n2. Select **Privacy Settings**\n3. Scroll to **Delete Account**\n4. Confirm your decision\n\n⚠️ This action is permanent and will delete all your data.', 'account', true, 9),

-- Troubleshooting
('Why is AYN not responding?', 'If AYN is not responding, try these steps:\n\n1. **Check your internet connection**\n2. **Refresh the page**\n3. **Clear your browser cache**\n4. **Try a different browser**\n\nIf the issue persists, please create a support ticket.', 'troubleshooting', true, 10),

('I forgot my password. How do I reset it?', 'To reset your password:\n\n1. Click **Sign In**\n2. Click **Forgot Password**\n3. Enter your email address\n4. Check your inbox for a reset link\n5. Click the link and create a new password\n\nThe reset link expires after 24 hours.', 'troubleshooting', true, 11),

('My file upload failed. What should I do?', 'File upload issues can be caused by:\n\n- **File too large** - Max size is 10MB\n- **Unsupported format** - Use PDF, PNG, JPG, or TXT\n- **Network issues** - Check your connection\n\nTry compressing your file or converting it to a supported format.', 'troubleshooting', true, 12);
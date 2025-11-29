import { Language } from '../types';

export const translations = {
  [Language.EN]: {
    // App Structure
    'app.subtitle': 'Archive of You',
    'nav.flow': 'Flow',
    'nav.calendar': 'Calendar',
    'nav.insights': 'Insights',
    'search.placeholder': 'Search memories...',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.username': 'Username',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.start': 'Start Thinking',
    'auth.createAccount': 'Create Account',
    'auth.mode.cloud': 'Cloud Sync Active. Data is stored in your database.',
    'auth.mode.local': 'Local Mode. Data stays on this device.',
    'auth.settings': 'Data Settings',
    'auth.checkEmail': 'Check Your Email',
    'auth.emailSent': 'We\'ve sent a confirmation link to',
    'auth.backLogin': 'Back to Login',
    
    // User Menu
    'menu.signedIn': 'Signed in as',
    'menu.manageData': 'Manage Data',
    'menu.changePassword': 'Change Password',
    'menu.logout': 'Log Out',
    'menu.deleteAccount': 'Delete Account',
    'menu.language': 'Language',
    
    // Modals
    'modal.cancel': 'Cancel',
    'modal.update': 'Update',
    'modal.delete': 'Delete',
    'modal.deleteConfirm': 'Delete Account?',
    'modal.deleteDesc': 'This action will deactivate your account and clear your personal data from this device. You will be logged out immediately.',
    'modal.yesDeactivate': 'Yes, Deactivate',
    'modal.newThought': 'New Thought',
    'modal.mindPlaceholder': "What's on your mind?",
    'modal.addNote': 'Add Note',
    
    // Timeline
    'timeline.empty': 'No entries found.',
    'timeline.emptySub': 'Try recording a new thought.',
    'timeline.play': 'Play recording',
    'timeline.share': 'Share',
    'timeline.delete': 'Delete',
    'timeline.insight': 'Get AI Insight',
    'timeline.deleteConfirm': 'Are you sure you want to delete this entry?',
    
    // Stats
    'stats.title': 'Insights',
    'stats.totalThoughts': 'Total Thoughts',
    'stats.topMood': 'Top Mood',
    'stats.spectrum': 'Emotional Spectrum',
    'stats.activity': 'Thinking Activity (Last 7 Days)',
    'stats.clusters': 'Mind Clusters (Tags)',
    
    // Manage Data
    'manage.title': 'Manage Data',
    'manage.empty': 'No entries to manage.',
    'manage.selectAll': 'Select All',
    'manage.deselectAll': 'Deselect All',
    'manage.deleteSelected': 'Delete',
    'manage.deleteConfirm': 'Are you sure you want to delete {count} entries? This action cannot be undone.',

    // Recording
    'record.listening': 'Listening...',
    'record.analyzing': 'Analyzing your thoughts...',
    'record.saved': 'Thought captured!',
    'record.failed': 'Analysis failed',

    // Emotions (Constants mapping)
    'emotion.JOY': 'Joy',
    'emotion.SADNESS': 'Sadness',
    'emotion.CALM': 'Calm',
    'emotion.ANGRY': 'Angry',
    'emotion.EXCITED': 'Excited',
    'emotion.ANXIOUS': 'Anxious',
    'emotion.NEUTRAL': 'Neutral',

    // Categories
    'category.Work': 'Work',
    'category.Life': 'Life',
    'category.Social': 'Social',
    'category.Philosophy': 'Philosophy',
    'category.Health': 'Health',
    'category.Idea': 'Idea',
    'category.Other': 'Other',
    'category.工作': 'Work',
    'category.生活': 'Life',
    'category.社交': 'Social',
    'category.哲学': 'Philosophy',
    'category.健康': 'Health',
    'category.灵感': 'Idea'
  },
  [Language.ZH]: {
    // App Structure
    'app.subtitle': '你的思维档案馆',
    'nav.flow': '心流',
    'nav.calendar': '日历',
    'nav.insights': '洞察',
    'search.placeholder': '搜索记忆...',
    
    // Auth
    'auth.login': '登录',
    'auth.register': '注册',
    'auth.username': '用户名',
    'auth.email': '邮箱',
    'auth.password': '密码',
    'auth.confirmPassword': '确认密码',
    'auth.start': '开始记录',
    'auth.createAccount': '创建账户',
    'auth.mode.cloud': '云端同步已开启。数据存储在您的数据库中。',
    'auth.mode.local': '本地模式。数据仅存储在此设备上。',
    'auth.settings': '数据设置',
    'auth.checkEmail': '检查您的邮箱',
    'auth.emailSent': '我们已发送确认链接至',
    'auth.backLogin': '返回登录',
    
    // User Menu
    'menu.signedIn': '当前登录',
    'menu.manageData': '管理数据',
    'menu.changePassword': '修改密码',
    'menu.logout': '退出登录',
    'menu.deleteAccount': '注销账户',
    'menu.language': '语言 / Language',
    
    // Modals
    'modal.cancel': '取消',
    'modal.update': '更新',
    'modal.delete': '删除',
    'modal.deleteConfirm': '注销账户？',
    'modal.deleteDesc': '此操作将停用您的账户并清除此设备上的个人数据。您将立即登出。',
    'modal.yesDeactivate': '确认注销',
    'modal.newThought': '新灵感',
    'modal.mindPlaceholder': "此刻你在想什么？",
    'modal.addNote': '添加笔记',
    
    // Timeline
    'timeline.empty': '暂无记录',
    'timeline.emptySub': '试着记录一个新的灵感吧。',
    'timeline.play': '播放录音',
    'timeline.share': '分享',
    'timeline.delete': '删除',
    'timeline.insight': 'AI 深度洞察',
    'timeline.deleteConfirm': '确定要删除这条记录吗？',
    
    // Stats
    'stats.title': '洞察分析',
    'stats.totalThoughts': '灵感总数',
    'stats.topMood': '主导情绪',
    'stats.spectrum': '情绪光谱',
    'stats.activity': '思维活跃度 (近7天)',
    'stats.clusters': '思维词云 (标签)',
    
    // Manage Data
    'manage.title': '管理数据',
    'manage.empty': '暂无数据可管理',
    'manage.selectAll': '全选',
    'manage.deselectAll': '取消全选',
    'manage.deleteSelected': '删除',
    'manage.deleteConfirm': '确定要删除 {count} 条记录吗？此操作无法撤销。',

    // Recording
    'record.listening': '正在聆听...',
    'record.analyzing': '正在分析您的思绪...',
    'record.saved': '灵感已保存！',
    'record.failed': '分析失败',

    // Emotions
    'emotion.JOY': '开心',
    'emotion.SADNESS': '难过',
    'emotion.CALM': '平静',
    'emotion.ANGRY': '生气',
    'emotion.EXCITED': '兴奋',
    'emotion.ANXIOUS': '焦虑',
    'emotion.NEUTRAL': '中性',

    // Categories
    'category.Work': '工作',
    'category.Life': '生活',
    'category.Social': '社交',
    'category.Philosophy': '哲学',
    'category.Health': '健康',
    'category.Idea': '灵感',
    'category.Other': '其他',
    'category.工作': '工作',
    'category.生活': '生活',
    'category.社交': '社交',
    'category.哲学': '哲学',
    'category.健康': '健康',
    'category.灵感': '灵感'
  }
};
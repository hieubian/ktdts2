import React from 'react'
import { Moon, Printer, Sun, HelpCircle, Cpu } from 'lucide-react'

interface NavbarProps {
  currentProblem: 'cau_1' | 'cau_2'
  onProblemChange: (problem: 'cau_1' | 'cau_2') => void
  activeTab: string
  onTabChange: (tab: any) => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
  onOpenHelp: () => void
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProblem,
  onProblemChange,
  activeTab,
  onTabChange,
  isDarkMode,
  onToggleDarkMode,
  onOpenHelp
}) => {
  return (
    <header className="apple-navbar no-print">
      <div className="apple-navbar-content">
        {/* Brand Group */}
        <div className="apple-brand-group">
          <div className="apple-brand-logo">
            <Cpu className="w-5 h-5 text-blue-500" />
          </div>
          <div className="apple-brand-text">
            <span className="apple-brand-title">K-Resolve</span>
            <span className="apple-brand-badge">KTDTS Apple Edition</span>
          </div>
        </div>

        {/* Primary Problem Switcher (Segmented Capsule) */}
        <div className="apple-problem-switcher">
          <button
            type="button"
            className={`apple-switcher-btn ${currentProblem === 'cau_1' ? 'active' : ''}`}
            onClick={() => {
              onProblemChange('cau_1')
              onTabChange('report')
            }}
          >
            <span>Rút gọn hàm Boolean (Câu 1–3)</span>
          </button>
          <button
            type="button"
            className={`apple-switcher-btn ${currentProblem === 'cau_2' ? 'active' : ''}`}
            onClick={() => {
              onProblemChange('cau_2')
              onTabChange('report')
            }}
          >
            <span>Thiết kế mạch tổ hợp (Câu 4–9)</span>
          </button>
        </div>

        {/* View Tabs */}
        <nav className="apple-sub-tabs">
          {currentProblem === 'cau_1' ? (
            <>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => onTabChange('report')}
              >
                Bài làm a, b, c
              </button>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'kmap' ? 'active' : ''}`}
                onClick={() => onTabChange('kmap')}
              >
                Bìa K-Map
              </button>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'circuit_basic' ? 'active' : ''}`}
                onClick={() => onTabChange('circuit_basic')}
              >
                Mạch cơ bản
              </button>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'circuit_target' ? 'active' : ''}`}
                onClick={() => onTabChange('circuit_target')}
              >
                Cổng biến đổi
              </button>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'truthtable' ? 'active' : ''}`}
                onClick={() => onTabChange('truthtable')}
              >
                Bảng chân lý
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'report' ? 'active' : ''}`}
                onClick={() => onTabChange('report')}
              >
                Bài làm trọn vẹn
              </button>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'truthtable' ? 'active' : ''}`}
                onClick={() => onTabChange('truthtable')}
              >
                Bảng chuyển mã
              </button>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'kmap' ? 'active' : ''}`}
                onClick={() => onTabChange('kmap')}
              >
                Bìa Karnaugh
              </button>
              <button
                type="button"
                className={`apple-sub-tab-btn ${activeTab === 'circuit_basic' ? 'active' : ''}`}
                onClick={() => onTabChange('circuit_basic')}
              >
                Sơ đồ mạch
              </button>
            </>
          )}
        </nav>

        {/* Right Side Actions */}
        <div className="apple-nav-actions">
          <button
            type="button"
            className="apple-nav-icon-btn"
            onClick={onOpenHelp}
            title="Hướng dẫn & Triết lý giải"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="apple-nav-icon-btn"
            onClick={() => window.print()}
            title="In / Xuất PDF bài thi"
          >
            <Printer className="w-4 h-4" />
          </button>

          <button
            type="button"
            className="apple-nav-icon-btn"
            onClick={onToggleDarkMode}
            title={isDarkMode ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  )
}

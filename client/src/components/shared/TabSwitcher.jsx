import './TabSwitcher.css';

const TabSwitcher = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="tab-switcher">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabSwitcher;

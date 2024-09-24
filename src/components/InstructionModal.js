import React from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  padding: 20px;
  border-radius: 5px;
  max-width: 80%;
  max-height: 80%;
  overflow-y: auto;
`;

const CloseButton = styled.button`
  float: right;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
`;

const InstructionModal = ({ show, onClose, currentPage }) => {
  if (!show) return null;

  const getInstructions = () => {
    switch (currentPage) {
      case "Index":
        return (
          <>
            <h2>1. 主控台</h2>
            <p>目的: 提供能源消耗、成本和二氧化碳排放的總覽儀表板。</p>

            <h3>1.1 總能耗與平均功率趨勢的組合圖表</h3>
            <p>目的: 顯示總能源消耗和平均功率隨時間的變化。</p>
            <ul>
              <li>展示能源使用趨勢,有助於識別模式或異常。</li>
              <li>雙軸方法便於比較總能耗和平均功率。</li>
            </ul>

            <h3>1.2 每日最高需求圖表</h3>
            <p>目的: 突出顯示每天15分鐘最高需求時段。</p>
            <ul>
              <li>
                幫助識別峰值負載發生時間,對需求管理和避免高峰費率至關重要。
              </li>
              <li>紅線表示合約容量,幫助用戶快速看出是否超出契約限制。</li>
            </ul>

            <h3>1.3 能源分佈餅圖</h3>
            <p>目的: 顯示不同機器群組間的能源消耗比例。</p>
            <ul>
              <li>允許用戶快速識別哪些群組或機器是最大消耗者。</li>
              <li>對於針對性的節能努力特別有用。</li>
            </ul>

            <h3>1.4 資訊卡(能耗、估計成本、二氧化碳排放)</h3>
            <p>目的: 提供關鍵指標的一目了然的摘要統計。</p>
            <ul>
              <li>為用戶提供總消耗、成本和環境影響的即時洞察。</li>
              <li>同時顯示季度和月度數據,便於快速比較和趨勢識別。</li>
            </ul>
          </>
        );
      case "RTMonitoring":
        return (
          <>
            <h2>2. 即時監控</h2>
            <p>目的: 對單個機器或機器群組進行即時監控。</p>

            <h3>2.1 機器方塊</h3>
            <p>目的: 顯示每台機器的實時狀態和關鍵指標。</p>
            <ul>
              <li>提供每台機器當前性能的快速概覽。</li>
              <li>能夠自定義顯示的指標,允許用戶專注於指定的數據。</li>
            </ul>

            <h3>2.2 搜索功能</h3>
            <p>目的: 在大量機器中快速定位特定機器。</p>
            <ul>
              <li>此功能增強了可用性,尤其是在監控眾多機器時。</li>
            </ul>

            <h3>2.3 群組選擇下拉菜單</h3>
            <p>目的: 根據預定義的群組過濾顯示的機器。</p>
            <ul>
              <li>允許集中監控特定區域或類型的機器。</li>
            </ul>
          </>
        );
      case "energyCostAnalysis":
        return (
          <>
            <h2>3. 能源成本分析</h2>
            <p>目的: 隨時間推移詳細分析能源成本。</p>

            <h3>3.1 能源消耗柱狀圖</h3>
            <p>
              目的:
              視覺化隨時間變化的能源消耗模式,按尖峰、半尖峰和離峰時段劃分。
            </p>
            <ul>
              <li>
                幫助識別使用模式和通過將消耗轉移到離峰時間來節省成本的潛在領域。
              </li>
            </ul>

            <h3>3.2 能源分佈餅圖</h3>
            <p>目的: 顯示不同費率時段消耗的能源比例。</p>
            <ul>
              <li>
                快速傳達在更昂貴的高峰時段與更便宜的離峰時段使用了多少能源。
              </li>
            </ul>

            <h3>3.3 詳細卡片</h3>
            <p>目的: 按費率時段提供能源消耗的數字細分。</p>
            <ul>
              <li>此卡片通過提供確切數字和百分比補充了餅圖。</li>
            </ul>

            <h3>3.4 數據表</h3>
            <p>目的: 提供能源消耗的詳細日常細分。</p>
            <ul>
              <li>允許對消耗模式和異常進行精細分析。</li>
            </ul>
          </>
        );
      case "energyPriceAnalysis":
        return (
          <>
            <h2>4. 能源價格分析</h2>
            <p>目的: 分析能源價格及其對成本的影響。</p>

            <h3>4.1 能源成本柱狀圖</h3>
            <p>目的: 類似於消耗圖表,但專注於成本而非千瓦時。</p>
            <ul>
              <li>幫助視覺化消耗如何轉化為實際費用。</li>
            </ul>

            <h3>4.2 成本分佈餅圖</h3>
            <p>目的: 顯示不同費率時段產生的成本比例。</p>
            <ul>
              <li>幫助識別哪些費率時段對總體成本影響最大。</li>
            </ul>

            <h3>4.3 價格表</h3>
            <p>目的: 顯示當前電價結構。</p>
            <ul>
              <li>
                為成本分析提供背景,幫助用戶理解不同時段的消耗如何影響他們的賬單。
              </li>
            </ul>
          </>
        );
      case "electricMeterDetails":
        return (
          <>
            <h2>5. 電錶詳情</h2>
            <p>目的: 單個電錶數據的詳細視圖。</p>

            <h3>5.1 十五分鐘需求 (FifteenMinuteDemand)</h3>
            <p>目的: 顯示每15分鐘的電力需求峰值。</p>
            <ul>
              <li>幫助識別短期高峰需求時段。</li>
            </ul>

            <h3>5.2 每日使用圖表 (DailyUsageChart)</h3>
            <p>目的: 展示每日能源使用模式。</p>
            <ul>
              <li>便於識別日常消耗趨勢和異常。</li>
            </ul>

            <h3>5.3 區間使用圖表 (IntervalUsageChart)</h3>
            <p>目的: 顯示特定時間區間內的能源使用情況。</p>
            <ul>
              <li>提供更精細的能源使用分析。</li>
            </ul>

            <h3>5.4 能源趨勢圖表 (EnergyTrendChart)</h3>
            <p>目的: 展示長期能源使用趨勢。</p>
            <ul>
              <li>幫助識別季節性模式和長期趨勢。</li>
            </ul>

            <h3>5.5 累積能源圖表 (CumulativeEnergyChart)</h3>
            <p>目的: 顯示累積能源使用量。</p>
            <ul>
              <li>提供總體能源消耗的清晰視圖。</li>
            </ul>

            <h3>5.6 功率熱圖 (PowerHeatmap)</h3>
            <p>目的: 以熱圖形式展示能源使用強度。</p>
            <ul>
              <li>直觀地顯示高能耗時段。</li>
            </ul>
          </>
        );
      case "SettingsPage":
        return (
          <>
            <h2>6. 設置頁面</h2>
            <p>目的: 配置各種系統設置的中心位置。</p>

            <h3>6.1 基本設置</h3>
            <p>目的: 配置影響整個系統的基本參數。</p>
            <ul>
              <li>設置二氧化碳排放係數，用於計算碳排放量。</li>
              <li>設置契約容量，用於在主控台的每日最高需求圖表中顯示紅線。</li>
              <li>選擇全局預設電價標準，影響成本計算。</li>
            </ul>

            <h3>6.2 群組管理</h3>
            <p>目的: 創建和管理機器群組。</p>
            <ul>
              <li>允許用戶將機器分類到不同群組中，便於管理和分析。</li>
              <li>提供拖放界面，方便用戶重新組織群組。</li>
              <li>支持添加、刪除和重命名群組。</li>
            </ul>

            <h3>6.3 電價設定</h3>
            <p>目的: 查看和編輯電價結構。</p>
            <ul>
              <li>顯示當前的電價結構，包括尖峰、半尖峰和離峰時段的價格。</li>
              <li>允許用戶修改電價，以反映最新的費率變化。</li>
              <li>支持設置不同季節（如夏季和非夏季）的電價。</li>
            </ul>
          </>
        );
      default:
        return <p>No instructions available for this page.</p>;
    }
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <CloseButton onClick={onClose}>&times;</CloseButton>
        {getInstructions()}
      </ModalContent>
    </ModalOverlay>
  );
};

export default InstructionModal;

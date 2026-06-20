import { ChevronDown, ChevronRight, Tag, Pin as PinIcon } from 'lucide-react';
import { SystemFieldsRenderer } from './SystemFieldsRenderer';
import { Tooltip, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { useEffect } from 'react';

interface AdditionalFieldsAccordionProps {
  additionalFieldsExpanded: boolean;
  setAdditionalFieldsExpanded: (expanded: boolean) => void;
  additionalFieldsTab: 'form' | 'system';
  setAdditionalFieldsTab: (tab: 'form' | 'system') => void;
  showMoreSystemFields: boolean;
  setShowMoreSystemFields: (show: boolean) => void;
  propertiesSearchQuery: string;
  additionalFieldsRef: React.RefObject<HTMLDivElement>;
  
  // Form field dropdowns
  showProjectNameDropdown: boolean;
  setShowProjectNameDropdown: (show: boolean) => void;
  showCostCenterDropdown: boolean;
  setShowCostCenterDropdown: (show: boolean) => void;
  showBuildingDropdown: boolean;
  setShowBuildingDropdown: (show: boolean) => void;
  showRequestChannelDropdown: boolean;
  setShowRequestChannelDropdown: (show: boolean) => void;
  
  // Selected values
  selectedProjectName: string;
  setSelectedProjectName: (name: string) => void;
  selectedCostCenter: string;
  setSelectedCostCenter: (center: string) => void;
  selectedBuilding: string;
  setSelectedBuilding: (building: string) => void;
  selectedRequestChannel: string;
  setSelectedRequestChannel: (channel: string) => void;
  companyValue: string;
  setCompanyValue: (value: string) => void;
  
  // Options
  projectNameOptions: any[];
  costCenterOptions: any[];
  buildingOptions: any[];
  requestChannelOptions: any[];
  
  // Refs
  projectNameDropdownRef: React.RefObject<HTMLDivElement>;
  costCenterDropdownRef: React.RefObject<HTMLDivElement>;
  buildingDropdownRef: React.RefObject<HTMLDivElement>;
  requestChannelDropdownRef: React.RefObject<HTMLDivElement>;
  
  // Helper functions
  getFilteredAdditionalFormFields: () => string[];
  getFilteredAdditionalFields: () => string[];
  togglePinField: (field: string) => void;
  getCurrentProjectNameColor: () => string;
  getCurrentCostCenterColor: () => string;
  getCurrentRequestChannelColor: () => string;
  
  // Pinned fields
  pinnedFields: string[];

  // Render the asset-specific system fields instead of the ticket ones
  assetMode?: boolean;
}

export function AdditionalFieldsAccordion(props: AdditionalFieldsAccordionProps) {
  const {
    additionalFieldsExpanded,
    setAdditionalFieldsExpanded,
    additionalFieldsTab,
    setAdditionalFieldsTab,
    showMoreSystemFields,
    setShowMoreSystemFields,
    propertiesSearchQuery,
    additionalFieldsRef,
    showProjectNameDropdown,
    setShowProjectNameDropdown,
    showCostCenterDropdown,
    setShowCostCenterDropdown,
    showBuildingDropdown,
    setShowBuildingDropdown,
    showRequestChannelDropdown,
    setShowRequestChannelDropdown,
    selectedProjectName,
    setSelectedProjectName,
    selectedCostCenter,
    setSelectedCostCenter,
    selectedBuilding,
    setSelectedBuilding,
    selectedRequestChannel,
    setSelectedRequestChannel,
    companyValue,
    setCompanyValue,
    projectNameOptions,
    costCenterOptions,
    buildingOptions,
    requestChannelOptions,
    projectNameDropdownRef,
    costCenterDropdownRef,
    buildingDropdownRef,
    requestChannelDropdownRef,
    getFilteredAdditionalFormFields,
    getFilteredAdditionalFields,
    togglePinField,
    getCurrentProjectNameColor,
    getCurrentCostCenterColor,
    getCurrentRequestChannelColor,
    pinnedFields,
    assetMode = false,
  } = props;

  useEffect(() => {
    // Close dropdowns when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      // Project Name dropdown
      if (showProjectNameDropdown && projectNameDropdownRef.current && !projectNameDropdownRef.current.contains(event.target as Node)) {
        setShowProjectNameDropdown(false);
      }
      
      // Cost Center dropdown
      if (showCostCenterDropdown && costCenterDropdownRef.current && !costCenterDropdownRef.current.contains(event.target as Node)) {
        setShowCostCenterDropdown(false);
      }
      
      // Building dropdown
      if (showBuildingDropdown && buildingDropdownRef.current && !buildingDropdownRef.current.contains(event.target as Node)) {
        setShowBuildingDropdown(false);
      }
      
      // Request Channel dropdown
      if (showRequestChannelDropdown && requestChannelDropdownRef.current && !requestChannelDropdownRef.current.contains(event.target as Node)) {
        setShowRequestChannelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    showProjectNameDropdown,
    showCostCenterDropdown,
    showBuildingDropdown,
    showRequestChannelDropdown,
    projectNameDropdownRef,
    costCenterDropdownRef,
    buildingDropdownRef,
    requestChannelDropdownRef,
    setShowProjectNameDropdown,
    setShowCostCenterDropdown,
    setShowBuildingDropdown,
    setShowRequestChannelDropdown
  ]);

  return (
    <div className="border border-[#DFE5ED] rounded-lg" ref={additionalFieldsRef}>
      <button
        onClick={() => setAdditionalFieldsExpanded(!additionalFieldsExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-[#F8F9FB] transition-colors rounded-lg"
      >
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-[#364658]" />
          <h3 className="text-[13px] font-semibold text-[#364658]">Additional Fields</h3>
        </div>
        {additionalFieldsExpanded ? (
          <ChevronDown size={16} className="text-[#7B8FA5]" />
        ) : (
          <ChevronRight size={16} className="text-[#7B8FA5]" />
        )}
      </button>

      {(additionalFieldsExpanded || propertiesSearchQuery) && (
        <div className="px-4 pb-4">
          {/* Tabs */}
          <div className="flex gap-1 mb-3 border-b border-[#E5E7EB]">
            <button
              onClick={() => setAdditionalFieldsTab('form')}
              className={`px-3 py-1.5 text-[13px] font-medium transition-colors border-b-2 -mb-[1px] ${
                additionalFieldsTab === 'form'
                  ? 'border-[#3D8BD0] text-[#3D8BD0]'
                  : 'border-transparent text-[#7B8FA5] hover:text-[#364658]'
              }`}
            >
              Form Fields
            </button>
            <button
              onClick={() => setAdditionalFieldsTab('system')}
              className={`px-3 py-1.5 text-[13px] font-medium transition-colors border-b-2 -mb-[1px] ${
                additionalFieldsTab === 'system'
                  ? 'border-[#3D8BD0] text-[#3D8BD0]'
                  : 'border-transparent text-[#7B8FA5] hover:text-[#364658]'
              }`}
            >
              System Fields
            </button>
          </div>

          {/* Form Fields Content */}
          {additionalFieldsTab === 'form' && (
            <div className="space-y-3">
              {getFilteredAdditionalFormFields().includes('Project Name') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Project Name</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Project Name'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Project Name') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Project Name') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={projectNameDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentProjectNameColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowProjectNameDropdown(!showProjectNameDropdown)}
                  >
                    {selectedProjectName}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showProjectNameDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-max min-w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {projectNameOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedProjectName(option.label);
                            setShowProjectNameDropdown(false);
                          }}
                        >
                          <div 
                            className="size-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {getFilteredAdditionalFormFields().includes('Cost Center') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Cost Center</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Cost Center'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Cost Center') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Cost Center') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={costCenterDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentCostCenterColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowCostCenterDropdown(!showCostCenterDropdown)}
                  >
                    {selectedCostCenter}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showCostCenterDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-max min-w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {costCenterOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedCostCenter(option.label);
                            setShowCostCenterDropdown(false);
                          }}
                        >
                          <div 
                            className="size-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {getFilteredAdditionalFormFields().includes('Business Unit') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Business Unit</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Business Unit'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Business Unit') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Business Unit') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <input
                  type="text"
                  value={companyValue}
                  onChange={(e) => setCompanyValue(e.target.value)}
                  className="flex-1 px-3 py-2 text-[13px] text-[#364658] rounded-md hover:bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent focus:bg-white"
                />
              </div>
              )}

              {getFilteredAdditionalFormFields().includes('Building') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Building</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Building'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Building') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Building') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={buildingDropdownRef}>
                  <button
                    className="w-full pl-3 pr-8 py-2 text-[13px] text-[#364658] rounded-md hover:bg-[#F5F7FA] focus:outline-none focus:ring-2 focus:ring-[#3D8BD0] focus:border-transparent focus:bg-white text-left"
                    onClick={() => setShowBuildingDropdown(!showBuildingDropdown)}
                  >
                    {selectedBuilding}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showBuildingDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-full bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {buildingOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedBuilding(option.label);
                            setShowBuildingDropdown(false);
                          }}
                        >
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}

              {getFilteredAdditionalFormFields().includes('Request Channel') && (
              <div className="flex items-center justify-between gap-3">
                <div className="text-[12px] text-[#4A5568] flex-shrink-0 w-[120px] group/label flex items-center gap-1">
                  <span>Request Channel</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation(); togglePinField('Request Channel'); }}
                        className="flex items-center"
                      >
                        <PinIcon
                          size={14}
                          className={`transition-opacity ${pinnedFields.includes('Request Channel') ? 'text-[#3D8BD0] opacity-100' : 'text-[#7B8FA5] opacity-0 group-hover/label:opacity-100'}`}
                        />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {pinnedFields.includes('Request Channel') ? 'Unpin this field' : 'Pin this field on top'}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="group relative flex-1" ref={requestChannelDropdownRef}>
                  <div 
                    className="absolute left-3 top-1/2 -translate-y-1/2 size-2 rounded-full pointer-events-none z-10"
                    style={{ backgroundColor: getCurrentRequestChannelColor() }}
                  ></div>
                  <button
                    className="w-full pl-6 pr-8 py-2 text-[13px] text-[#364658] bg-transparent border-none rounded-md cursor-pointer hover:bg-[#F3F4F6] focus:outline-none focus:bg-[#F3F4F6] transition-colors text-left"
                    onClick={() => setShowRequestChannelDropdown(!showRequestChannelDropdown)}
                  >
                    {selectedRequestChannel}
                  </button>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7B8FA5] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {showRequestChannelDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-max min-w-[200px] bg-white rounded-lg shadow-lg border border-[#DFE5ED] py-2 z-50">
                      {requestChannelOptions.map((option) => (
                        <button
                          key={option.label}
                          className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F9FAFB] text-left transition-colors"
                          onClick={() => {
                            setSelectedRequestChannel(option.label);
                            setShowRequestChannelDropdown(false);
                          }}
                        >
                          <div 
                            className="size-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                          <span className="text-[13px] text-[#364658] truncate">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              )}
            </div>
          )}

          {/* System Fields Content */}
          {additionalFieldsTab === 'system' && (
            <SystemFieldsRenderer
              fields={getFilteredAdditionalFields()}
              showMore={showMoreSystemFields}
              onToggleShowMore={() => setShowMoreSystemFields(!showMoreSystemFields)}
              pinnedFields={pinnedFields}
              onTogglePin={togglePinField}
              assetMode={assetMode}
            />
          )}
        </div>
      )}
    </div>
  );
}
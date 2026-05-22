import React from 'react';

interface UserTypeSelectorProps {
  selectedType: string;
  onTypeChange: (type: string) => void;
}

const UserTypeSelector: React.FC<UserTypeSelectorProps> = ({ selectedType, onTypeChange }) => {
  return (
    <fieldset className="mt-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label htmlFor="employee" className="cursor-pointer">
          <div
            className={`space-y-4 py-8 px-4 shadow border border-4 rounded-md sm:rounded-lg sm:flex sm:items-center sm:space-y-0 sm:space-x-10 transition-colors ${
              selectedType === 'employee'
                ? 'bg-cdi-freelancer-02 text-white'
                : 'bg-white hover:border-orange-300'
            }`}
          >
            <div className="items-center">
              <input
                type="radio"
                id="employee"
                name="user_type"
                value="employee"
                checked={selectedType === 'employee'}
                onChange={() => onTypeChange('employee')}
                className="h-4 w-4 border-gray-300 color-cdi-client-03 focus:ring-indigo-500"
              />
              <span className="-mt-10 ml-7 block text-2xl font-normal font-['poppins']">
                I'm a Freelancer, Get Hired & Grow
              </span>
              <p className={`ml-7 block text-sm font-normal font-['poppins'] ${
                selectedType === 'employee' ? 'text-white' : 'text-gray-300'
              }`}>
                Showcase your skills, connect with clients, and work on exciting projects that match your expertise. Take control of your career and earn on your terms.
              </p>
            </div>
          </div>
        </label>

        <label htmlFor="employer" className="cursor-pointer">
          <div
            className={`space-y-4 py-8 px-4 shadow border border-4 rounded-md sm:rounded-lg sm:flex sm:items-center sm:space-y-0 sm:space-x-10 transition-colors ${
              selectedType === 'employer'
                ? 'bg-cdi-client-02 text-white'
                : 'bg-white hover:border-sky-600'
            }`}
          >
            <div className="items-center">
              <input
                type="radio"
                id="employer"
                name="user_type"
                value="employer"
                checked={selectedType === 'employer'}
                onChange={() => onTypeChange('employer')}
                className="h-4 w-4 border-gray-300 color-cdi-client-03 focus:ring-indigo-500"
              />
              <span className="-mt-10 ml-7 block text-2xl font-normal font-['poppins']">
                I'm Hiring, Find Top Talent
              </span>
              <p className={`ml-7 block text-sm font-normal font-['poppins'] ${
                selectedType === 'employer' ? 'text-white' : 'text-gray-300'
              }`}>
                Build your dream team with skilled freelancers from around the world. Post projects, manage work effortlessly, and scale your business with ease.
              </p>
            </div>
          </div>
        </label>
      </div>
    </fieldset>
  );
};

export default UserTypeSelector; 
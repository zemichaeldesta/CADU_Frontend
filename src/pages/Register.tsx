import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { memberApplicationsAPI } from '../api/memberApplications';
import './Register.css';

interface FormData {
  fullname: string;
  birthdate: string;
  gender: string;
  citizenship: string;
  country: string;
  region: string;
  town: string;
  district: string;
  phone: string;
  email: string;
  spouse: string;
  spousePhone: string;
  study: string;
  workFrom: string;
  workTo: string;
  fee200: boolean;
  fee50: boolean;
  voluntaryBirr: string;
  voluntaryUSD: string;
  profilePicture: File | null;
  receiptPhoto: File | null;
}

const Register: React.FC = () => {
  const { language } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState<FormData>({
    fullname: '',
    birthdate: '',
    gender: '',
    citizenship: '',
    country: '',
    region: '',
    town: '',
    district: '',
    phone: '',
    email: '',
    spouse: '',
    spousePhone: '',
    study: '',
    workFrom: '',
    workTo: '',
    fee200: false,
    fee50: false,
    voluntaryBirr: '',
    voluntaryUSD: '',
    profilePicture: null,
    receiptPhoto: null,
  });
  const [profilePreview, setProfilePreview] = useState<string | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target;
    if (target.type === 'checkbox') {
      const checkbox = target as HTMLInputElement;
      setForm({ ...form, [target.name]: checkbox.checked });
    } else {
      setForm({ ...form, [target.name]: target.value });
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm({ ...form, profilePicture: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReceiptPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setForm({ ...form, receiptPhoto: file });
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Append all text fields with correct field names (snake_case for backend)
      formData.append('fullname', form.fullname);
      if (form.birthdate) formData.append('birthdate', form.birthdate);
      if (form.gender) formData.append('gender', form.gender);
      if (form.citizenship) formData.append('citizenship', form.citizenship);
      if (form.country) formData.append('country', form.country);
      if (form.region) formData.append('region', form.region);
      if (form.town) formData.append('town', form.town);
      if (form.district) formData.append('district', form.district);
      if (form.phone) formData.append('phone', form.phone);
      if (form.email) formData.append('email', form.email);
      if (form.spouse) formData.append('spouse', form.spouse);
      if (form.spousePhone) formData.append('spousePhone', form.spousePhone);
      if (form.study) formData.append('study', form.study);
      if (form.workFrom) formData.append('workFrom', form.workFrom);
      if (form.workTo) formData.append('workTo', form.workTo);
      // Convert checkbox values to amounts
      if (form.fee200) {
        formData.append('registration_fee_amount', '200');
        formData.append('initial_payment_amount', '200');
      }
      if (form.fee50) {
        formData.append('monthly_fee_amount', '50');
      }
      if (form.voluntaryBirr) formData.append('voluntaryBirr', form.voluntaryBirr);
      if (form.voluntaryUSD) formData.append('voluntaryUSD', form.voluntaryUSD);

      // Append files with correct field names
      if (form.profilePicture) {
        formData.append('profile_picture', form.profilePicture);
      }
      if (form.receiptPhoto) {
        formData.append('receipt_photo', form.receiptPhoto);
      }

      // Submit application to API
      await memberApplicationsAPI.submitApplication(formData);
      
      showSuccess(
        language === 'am' 
          ? 'የአባልነት ቅጹ ተላልፏል!' 
          : 'Membership form submitted successfully!'
      );
      
      // Reset form
      setForm({
        fullname: '',
        birthdate: '',
        gender: '',
        citizenship: '',
        country: '',
        region: '',
        town: '',
        district: '',
        phone: '',
        email: '',
        spouse: '',
        spousePhone: '',
        study: '',
        workFrom: '',
        workTo: '',
        fee200: false,
        fee50: false,
        voluntaryBirr: '',
        voluntaryUSD: '',
        profilePicture: null,
        receiptPhoto: null,
      });
      setProfilePreview(null);
      setReceiptPreview(null);
    } catch (error: any) {
      console.error('Failed to submit registration:', error);
      showError(
        error.response?.data?.detail ||
        (language === 'am'
          ? 'ቅጹን ለመላክ ስህተት ተፈጥሯል።'
          : 'Failed to submit form. Please try again.')
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <h1>
          {language === 'am'
            ? 'የአባላት መመዝገቢያ ቅጽ'
            : 'Membership Registration Form'}
        </h1>
        <form className="register-form" onSubmit={handleSubmit}>
          {/* 1. Full Name */}
          <div className="form-group">
            <label>
              1. {language === 'am' ? 'ሙሉ ስም ከነአያት' : 'Full Name with Grand Father'}
            </label>
            <input
              type="text"
              name="fullname"
              value={form.fullname}
              onChange={update}
              required
            />
          </div>

          {/* 2. Birth Date */}
          <div className="form-group">
            <label>
              2. {language === 'am' ? 'እድሜ' : 'Birth Date'}
            </label>
            <input
              type="date"
              name="birthdate"
              value={form.birthdate}
              onChange={update}
              required
            />
          </div>

          {/* 3. Gender */}
          <div className="form-group">
            <label>
              3. {language === 'am' ? 'ፆታ' : 'Gender'}
            </label>
            <select
              name="gender"
              value={form.gender}
              onChange={update}
              required
            >
              <option value="">{language === 'am' ? '-- ይምረጡ --' : '-- Select --'}</option>
              <option value="Male">{language === 'am' ? 'ወንድ' : 'Male'}</option>
              <option value="Female">{language === 'am' ? 'ሴት' : 'Female'}</option>
              <option value="Other">{language === 'am' ? 'ሌላ' : 'Other'}</option>
            </select>
          </div>

          {/* 4. Citizenship */}
          <div className="form-group">
            <label>
              4. {language === 'am' ? 'ዜግነት' : 'Citizenship'}
            </label>
            <input
              type="text"
              name="citizenship"
              value={form.citizenship}
              onChange={update}
              required
            />
          </div>

          {/* 5 & 6. Country & Region */}
          <div className="form-row">
            <div className="form-group">
              <label>
                5. {language === 'am' ? 'አገር' : 'Country'}
              </label>
              <input
                type="text"
                name="country"
                value={form.country}
                onChange={update}
                required
              />
            </div>
            <div className="form-group">
              <label>
                6. {language === 'am' ? 'ክልል' : 'Regional State'}
              </label>
              <input
                type="text"
                name="region"
                value={form.region}
                onChange={update}
                required
              />
            </div>
          </div>

          {/* 7 & 8. Town & District */}
          <div className="form-row">
            <div className="form-group">
              <label>
                7. {language === 'am' ? 'ከተማ' : 'Town'}
              </label>
              <input
                type="text"
                name="town"
                value={form.town}
                onChange={update}
                required
              />
            </div>
            <div className="form-group">
              <label>
                8. {language === 'am' ? 'ወረዳ' : 'District'}
              </label>
              <input
                type="text"
                name="district"
                value={form.district}
                onChange={update}
                required
              />
            </div>
          </div>

          {/* 9 & 10. Phone & Email */}
          <div className="form-row">
            <div className="form-group">
              <label>
                9. {language === 'am' ? 'ስልክ' : 'Tel'}
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={update}
                required
              />
            </div>
            <div className="form-group">
              <label>
                10. {language === 'am' ? 'ኢሜል' : 'Email'}
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                required
              />
            </div>
          </div>

          {/* 11 & 12. Spouse Name & Phone */}
          <div className="form-row">
            <div className="form-group">
              <label>
                11. {language === 'am' ? 'የባለቤት ሙሉ ስም' : 'Spouse Name'}
              </label>
              <input
                type="text"
                name="spouse"
                value={form.spouse}
                onChange={update}
              />
            </div>
            <div className="form-group">
              <label>
                12. {language === 'am' ? 'የባለቤት ስልክ' : 'Spouse Phone'}
              </label>
              <input
                type="tel"
                name="spousePhone"
                value={form.spousePhone}
                onChange={update}
              />
            </div>
          </div>

          {/* 13. Field of Study */}
          <div className="form-group">
            <label>
              13. {language === 'am' ? 'የትምህርት መስክ' : 'Field of Study'}
            </label>
            <input
              type="text"
              name="study"
              value={form.study}
              onChange={update}
              required
            />
          </div>

          {/* 14. Years Worked */}
          <div className="form-row">
            <div className="form-group">
              <label>
                14. {language === 'am' ? 'የሥራ ዘመን (ከ)' : 'Years Worked (From)'}
              </label>
              <input
                type="number"
                name="workFrom"
                value={form.workFrom}
                onChange={update}
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="form-group">
              <label>
                14. {language === 'am' ? 'የሥራ ዘመን (እስከ)' : 'Years Worked (To)'}
              </label>
              <input
                type="number"
                name="workTo"
                value={form.workTo}
                onChange={update}
                min="1900"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>

          {/* 15. Membership Fees */}
          <div className="form-group">
            <label className="form-label-block">
              15. {language === 'am' ? 'የአባልነት መዋጮ' : 'Membership Fee'}
            </label>
            <div className="checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  name="fee200"
                  checked={form.fee200}
                  onChange={update}
                />
                <span>15.1. {language === 'am' ? 'ብር 200' : 'Birr 200'}</span>
              </div>
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  name="fee50"
                  checked={form.fee50}
                  onChange={update}
                />
                <span>15.2. {language === 'am' ? 'ወርሃዊ ብር 50' : 'Monthly 50 Birr'}</span>
              </div>
            </div>
          </div>

          {/* 16. Voluntary Donation */}
          <div className="form-group">
            <label>
              16. {language === 'am' ? 'በፍቃደኝነት መዋጮ' : 'Voluntary Donation'}
            </label>
            <input
              type="text"
              name="voluntaryBirr"
              value={form.voluntaryBirr}
              onChange={update}
              placeholder={language === 'am' ? 'ብር' : 'Birr'}
            />
            <input
              type="text"
              name="voluntaryUSD"
              value={form.voluntaryUSD}
              onChange={update}
              placeholder="USD"
              className="mt-2"
            />
          </div>

          {/* Profile Picture Upload */}
          <div className="form-group">
            <label>
              {language === 'am' ? 'ፎቶ / የግል ምስል' : 'Photo / Profile Picture'}
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="file-input"
              />
              {profilePreview && (
                <div className="image-preview">
                  <img src={profilePreview} alt="Profile preview" />
                </div>
              )}
            </div>
          </div>

          {/* Receipt Photo Upload */}
          <div className="form-group">
            <label>
              {language === 'am' ? 'የደረሰኝ ፎቶ / Receipt Photo' : 'Receipt Photo'}
            </label>
            <div className="file-upload-container">
              <input
                type="file"
                accept="image/*"
                onChange={handleReceiptPhotoChange}
                className="file-input"
              />
              {receiptPreview && (
                <div className="image-preview">
                  <img src={receiptPreview} alt="Receipt preview" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="submit-btn"
            disabled={submitting}
          >
            {submitting
              ? (language === 'am' ? 'ይላካል...' : 'Submitting...')
              : (language === 'am' ? 'ቅጹን ላክ' : 'Submit Form')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;


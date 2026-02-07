import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { caduMembersAPI, CADUMember } from '../api/caduMembers';
import './Members.css';

const Members: React.FC = () => {
  const { language } = useLanguage();
  const [members, setMembers] = useState<CADUMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());

  useEffect(() => {
    const loadMembers = async () => {
      try {
        setLoading(true);
        const data = await caduMembersAPI.getCADUMembers();
        const sortedMembers = [...data].sort((a, b) => {
          // Sort by member type priority: honorary first, then others
          const typePriority: Record<string, number> = {
            honorary: 0,
            executive: 1,
            general_assembly: 2,
            regular: 3,
          };
          const aPriority = typePriority[a.member_type] ?? 3;
          const bPriority = typePriority[b.member_type] ?? 3;
          if (aPriority !== bPriority) {
            return aPriority - bPriority;
          }
          return a.fullname.localeCompare(b.fullname);
        });
        // Debug: Log member data to verify URLs and consent
        console.log('Loaded members:', sortedMembers.map(m => ({
          id: m.id,
          name: m.fullname,
          hasConsent: m.photo_consent,
          hasPhotoUrl: !!m.profile_picture_url,
          photoUrl: m.profile_picture_url
        })));
        setMembers(sortedMembers);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load members:', err);
        const maintenanceMessage =
          language === 'am'
            ? 'የአባላት ዝርዝር ለማዘመን በሂደት ላይ ነው። እባክዎን በትንሽ ጊዜ ይሞክሩ ወይም ያግኙን።'
            : 'We are updating the member directory. Please try again shortly or contact us directly.';
        setError(maintenanceMessage);
      } finally {
        setLoading(false);
      }
    };

    loadMembers();
  }, [language]);

  if (loading) {
    return (
      <div className="members-page">
        <div className="container">
          <div className="content-section">
            <h1>{language === 'am' ? 'አባላት' : 'Members'}</h1>
            <div className="members-content">
              <p>{language === 'am' ? 'በመጫን ላይ...' : 'Loading...'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="members-page">
        <div className="container">
          <div className="content-section">
            <h1>{language === 'am' ? 'አባላት' : 'Members'}</h1>
            <div className="members-content">
              <p className="error">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="members-page">
      <div className="container">
        <div className="content-section">
          <h1>{language === 'am' ? 'አባላት' : 'Members'}</h1>
          {members.length === 0 ? (
            <div className="members-content">
              <p>{language === 'am' ? 'አባላት እስካሁን አልተገኙም።' : 'No members found yet.'}</p>
            </div>
          ) : (
            <div className="members-grid">
              {members.map((member) => {
                // Check if member has given consent to show their photo
                const hasConsented = member.photo_consent === true;
                
                // Only show photo if:
                // 1. Member has given consent
                // 2. Photo URL exists
                // 3. Image hasn't failed to load
                const hasImageError = imageErrors.has(member.id);
                const photoUrl = member.profile_picture_url || undefined;
                const shouldShowPhoto = hasConsented && photoUrl && !hasImageError;

                return (
                  <div key={member.id} className="member-card">
                    <div className="member-image-wrapper">
                      {shouldShowPhoto ? (
                        <img
                          src={photoUrl}
                          alt={member.fullname}
                          className="member-image"
                          onError={(e) => {
                            console.error(`Failed to load image for member ${member.id}:`, photoUrl);
                            // Mark this image as failed to load and show placeholder
                            setImageErrors((prev) => new Set(prev).add(member.id));
                          }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="member-image-placeholder">
                          {member.fullname.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {member.member_type === 'honorary' && (
                        <span className="honorary-badge">
                          {language === 'am' ? 'ክቡር' : 'Honorary'}
                        </span>
                      )}
                    </div>
                    <div className="member-info">
                      <h3 className="member-name">{member.fullname}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Members;


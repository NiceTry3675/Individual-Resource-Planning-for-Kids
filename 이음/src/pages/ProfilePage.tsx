import { getProfile, profileOptions, saveProfile } from '../api/ieum';
import { PageTitle } from '../components/common/PageTitle';
import { AsyncView } from '../components/common/States';
import { useToast } from '../components/common/Toast';
import { useAsync } from '../components/common/useAsync';
import { ProfileForm } from '../components/profile/ProfileForm';

export default function ProfilePage() {
  const { state, retry } = useAsync(() => getProfile());
  const say = useToast();

  return (
    <div className="space-y-5">
      <PageTitle title="프로필" back backTo="/more" description="처음 한 번만 등록하면 돼요" />
      <AsyncView state={state} retry={retry}>
        {(profile) => (
          <ProfileForm
            key={profile.name + profile.birthDate}
            profile={profile}
            options={profileOptions}
            onSave={async (p) => {
              try {
                await saveProfile(p);
                say('프로필을 저장했어요.');
              } catch {
                say('저장하지 못했어요. 다시 시도해 주세요.');
              }
            }}
          />
        )}
      </AsyncView>
    </div>
  );
}

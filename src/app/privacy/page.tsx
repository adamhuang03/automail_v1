import fs from 'fs';
import path from 'path';

export default function PrivacyPolicyPage() {
  const filePath = path.join(process.cwd(), 'src', 'components', 'html', 'privacy-policy.html');
  const htmlContent = fs.readFileSync(filePath, 'utf8');

  return (
    <div>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  );
}

using System.Windows;

namespace WordSetupTool
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            
            // Request admin privileges
            if (!IsRunAsAdmin())
            {
                MessageBox.Show(
                    "⚠️ Vui lòng chạy ứng dụng với quyền Administrator!\n\n" +
                    "Right-click → Run as administrator",
                    "Cần quyền Admin",
                    MessageBoxButton.OK,
                    MessageBoxImage.Warning);
            }
        }

        private bool IsRunAsAdmin()
        {
            var identity = System.Security.Principal.WindowsIdentity.GetCurrent();
            var principal = new System.Security.Principal.WindowsPrincipal(identity);
            return principal.IsInRole(System.Security.Principal.WindowsBuiltInRole.Administrator);
        }
    }
}

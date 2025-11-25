using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace WordSetupTool
{
    public partial class MainWindow : Window
    {
        private readonly SetupService _setupService;
        private bool _isRunning = false;
        private double _progressBarMaxWidth = 420; // Will be calculated

        public MainWindow()
        {
            InitializeComponent();
            _setupService = new SetupService();
            _setupService.OnProgress += SetupService_OnProgress;
            _setupService.OnStepComplete += SetupService_OnStepComplete;
            
            // Calculate progress bar width after layout
            Loaded += (s, e) => 
            {
                var parent = progressFill.Parent as Border;
                if (parent != null)
                    _progressBarMaxWidth = parent.ActualWidth > 0 ? parent.ActualWidth : 420;
            };
        }

        private void Window_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            if (e.ButtonState == MouseButtonState.Pressed)
                DragMove();
        }

        private void BtnMinimize_Click(object sender, RoutedEventArgs e)
        {
            WindowState = WindowState.Minimized;
        }

        private async void BtnSetup_Click(object sender, RoutedEventArgs e)
        {
            if (_isRunning) return;
            
            _isRunning = true;
            btnSetup.IsEnabled = false;
            resultCard.Visibility = Visibility.Collapsed;

            // Reset all icons
            ResetAllSteps();

            try
            {
                var result = await _setupService.RunSetupAsync();
                ShowResult(result);
            }
            catch (Exception ex)
            {
                ShowResult(new SetupResult
                {
                    Success = false,
                    Title = "Lỗi!",
                    Message = ex.Message
                });
            }
            finally
            {
                _isRunning = false;
                btnSetup.IsEnabled = true;
            }
        }

        private void BtnClose_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void SetupService_OnProgress(int percent, string message)
        {
            Dispatcher.Invoke(() =>
            {
                // Update custom progress bar
                progressFill.Width = (_progressBarMaxWidth * percent) / 100;
                txtProgress.Text = $"{percent}%";
                txtStatus.Text = message;
            });
        }

        private void SetupService_OnStepComplete(int stepNumber, bool success)
        {
            Dispatcher.Invoke(() =>
            {
                var (icon, iconBg, step) = GetStepElements(stepNumber);
                
                if (icon != null && iconBg != null && step != null)
                {
                    if (success)
                    {
                        icon.Text = "✓";
                        icon.Foreground = Brushes.White;
                        icon.FontWeight = FontWeights.Bold;
                        iconBg.Background = new LinearGradientBrush(
                            Color.FromRgb(76, 175, 80),
                            Color.FromRgb(139, 195, 74),
                            45);
                        step.Foreground = new SolidColorBrush(Color.FromRgb(76, 175, 80));
                    }
                    else
                    {
                        icon.Text = "✗";
                        icon.Foreground = Brushes.White;
                        icon.FontWeight = FontWeights.Bold;
                        iconBg.Background = new LinearGradientBrush(
                            Color.FromRgb(244, 67, 54),
                            Color.FromRgb(255, 87, 34),
                            45);
                        step.Foreground = new SolidColorBrush(Color.FromRgb(244, 67, 54));
                    }
                }
            });
        }

        private void ResetAllSteps()
        {
            for (int i = 1; i <= 7; i++)
            {
                var (icon, iconBg, step) = GetStepElements(i);
                
                if (icon != null && iconBg != null && step != null)
                {
                    icon.Text = "○";
                    icon.Foreground = new SolidColorBrush(Color.FromRgb(85, 85, 85));
                    icon.FontWeight = FontWeights.Normal;
                    iconBg.Background = new SolidColorBrush(Color.FromRgb(45, 45, 68));
                    step.Foreground = new SolidColorBrush(Color.FromRgb(119, 119, 119));
                }
            }
            
            // Reset progress
            progressFill.Width = 0;
            txtProgress.Text = "0%";
            txtStatus.Text = "Sẵn sàng setup...";
        }

        private (TextBlock? icon, Border? iconBg, TextBlock? step) GetStepElements(int stepNumber)
        {
            return stepNumber switch
            {
                1 => (icon1, iconBg1, step1),
                2 => (icon2, iconBg2, step2),
                3 => (icon3, iconBg3, step3),
                4 => (icon4, iconBg4, step4),
                5 => (icon5, iconBg5, step5),
                6 => (icon6, iconBg6, step6),
                7 => (icon7, iconBg7, step7),
                _ => (null, null, null)
            };
        }

        private void ShowResult(SetupResult result)
        {
            Dispatcher.Invoke(() =>
            {
                resultCard.Visibility = Visibility.Visible;
                resultTitle.Text = result.Title;
                resultMessage.Text = result.Message;

                if (result.Success)
                {
                    resultIcon.Text = "✓";
                    resultIconBg.Background = new LinearGradientBrush(
                        Color.FromRgb(76, 175, 80),
                        Color.FromRgb(139, 195, 74),
                        45);
                }
                else
                {
                    resultIcon.Text = "!";
                    resultIconBg.Background = new LinearGradientBrush(
                        Color.FromRgb(255, 152, 0),
                        Color.FromRgb(255, 193, 7),
                        45);
                }
            });
        }
    }
}

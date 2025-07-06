import { useState } from 'react';
import { 
  Camera, 
  Upload, 
  Scan, 
  Plus, 
  Calendar, 
  AlertTriangle,
  Clock,
  CheckCircle,
  X,
  Trash2,
  Edit3,
  Eye,
  ImageIcon
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface Material {
  id: string;
  name: string;
  image: string;
  expiryDate: string;
  daysLeft: number;
  category: string;
  quantity: string;
  addedDate: string;
}

export function PhotoScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<Material | null>(null);
  const [materials, setMaterials] = useState<Material[]>([
    {
      id: '1',
      name: 'Organic Milk',
      image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&h=100&fit=crop',
      expiryDate: '2024-12-25',
      daysLeft: 2,
      category: 'Dairy',
      quantity: '1L',
      addedDate: '2024-12-20'
    },
    {
      id: '2',
      name: 'Fresh Spinach',
      image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop',
      expiryDate: '2024-12-24',
      daysLeft: 1,
      category: 'Vegetables',
      quantity: '200g',
      addedDate: '2024-12-21'
    },
    {
      id: '3',
      name: 'Chicken Breast',
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop',
      expiryDate: '2024-12-26',
      daysLeft: 3,
      category: 'Meat',
      quantity: '500g',
      addedDate: '2024-12-19'
    },
    {
      id: '4',
      name: 'Bread Loaf',
      image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=100&h=100&fit=crop',
      expiryDate: '2024-12-28',
      daysLeft: 5,
      category: 'Bakery',
      quantity: '1 loaf',
      addedDate: '2024-12-22'
    }
  ]);

  const [showAddManual, setShowAddManual] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    name: '',
    expiryDate: '',
    category: '',
    quantity: ''
  });

  const handleScan = () => {
    setIsScanning(true);
    // Simulate scanning process
    setTimeout(() => {
      const mockScanResult: Material = {
        id: Date.now().toString(),
        name: 'Fresh Tomatoes',
        image: 'https://images.unsplash.com/photo-1546470427-2db3e57b05e3?w=100&h=100&fit=crop',
        expiryDate: '2024-12-27',
        daysLeft: 4,
        category: 'Vegetables',
        quantity: '300g',
        addedDate: new Date().toISOString().split('T')[0]
      };
      setScanResult(mockScanResult);
      setIsScanning(false);
    }, 3000);
  };

  const handleAddScannedMaterial = () => {
    if (scanResult) {
      setMaterials(prev => [scanResult, ...prev]);
      setScanResult(null);
    }
  };

  const handleAddManual = () => {
    if (newMaterial.name && newMaterial.expiryDate) {
      const expiryDate = new Date(newMaterial.expiryDate);
      const today = new Date();
      const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const material: Material = {
        id: Date.now().toString(),
        name: newMaterial.name,
        image: 'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=100&h=100&fit=crop',
        expiryDate: newMaterial.expiryDate,
        daysLeft,
        category: newMaterial.category || 'Other',
        quantity: newMaterial.quantity || '1 item',
        addedDate: new Date().toISOString().split('T')[0]
      };
      
      setMaterials(prev => [material, ...prev]);
      setNewMaterial({ name: '', expiryDate: '', category: '', quantity: '' });
      setShowAddManual(false);
    }
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(material => material.id !== id));
  };

  const getExpiryStatus = (daysLeft: number) => {
    if (daysLeft < 0) return { color: 'bg-red-500', text: 'Expired', textColor: 'text-red-600' };
    if (daysLeft === 0) return { color: 'bg-red-500', text: 'Expires today', textColor: 'text-red-600' };
    if (daysLeft === 1) return { color: 'bg-orange-500', text: '1 day left', textColor: 'text-orange-600' };
    if (daysLeft <= 3) return { color: 'bg-yellow-500', text: `${daysLeft} days left`, textColor: 'text-yellow-600' };
    if (daysLeft <= 7) return { color: 'bg-blue-500', text: `${daysLeft} days left`, textColor: 'text-blue-600' };
    return { color: 'bg-green-500', text: `${daysLeft} days left`, textColor: 'text-green-600' };
  };

  const sortedMaterials = [...materials].sort((a, b) => a.daysLeft - b.daysLeft);

  return (
    <div className="ios-scroll bg-gray-50 relative">
      {/* Header */}
      <div className="bg-white px-4 py-6 border-b border-gray-100">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ingredient Scanner</h1>
          <p className="text-gray-600">Track your ingredients and expiry dates</p>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className={`flex-1 ios-button h-14 rounded-2xl text-white font-semibold flex items-center justify-center space-x-2 ${
              isScanning 
                ? 'bg-gray-400' 
                : 'bg-gradient-to-r from-green-500 to-blue-600 active:scale-95'
            }`}
          >
            <Camera className="w-5 h-5" />
            <span>{isScanning ? 'Scanning...' : 'Scan Item'}</span>
          </button>
          
          <button
            onClick={() => setShowAddManual(true)}
            className="ios-button h-14 px-6 rounded-2xl bg-blue-100 text-blue-600 font-semibold flex items-center justify-center active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="px-4 pb-32">
        {/* Scanning Animation */}
        {isScanning && (
          <div className="ios-card bg-white p-6 my-6 text-center">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center animate-pulse">
                <Scan className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Scanning ingredient...</h3>
            <p className="text-gray-600">Please hold steady while we identify your item</p>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="ios-card bg-white p-6 my-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Scan Result</h3>
              <button
                onClick={() => setScanResult(null)}
                className="p-2 rounded-full bg-gray-100 text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <ImageWithFallback
                src={scanResult.image}
                alt={scanResult.name}
                className="w-16 h-16 rounded-xl object-cover"
              />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{scanResult.name}</h4>
                <p className="text-sm text-gray-600">{scanResult.category} • {scanResult.quantity}</p>
                <Badge className={`mt-1 ${getExpiryStatus(scanResult.daysLeft).color} text-white`}>
                  {getExpiryStatus(scanResult.daysLeft).text}
                </Badge>
              </div>
            </div>
            
            <Button
              onClick={handleAddScannedMaterial}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Add to Inventory
            </Button>
          </div>
        )}

        {/* Materials List */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Your Ingredients</h2>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {materials.length} items
            </Badge>
          </div>

          {materials.length === 0 ? (
            <div className="ios-card bg-white p-8 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Scan className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">No ingredients yet</h3>
              <p className="text-gray-600">Start by scanning or adding your first ingredient</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedMaterials.map((material) => {
                const status = getExpiryStatus(material.daysLeft);
                return (
                  <div key={material.id} className="ios-card bg-white p-4">
                    <div className="flex items-center space-x-4">
                      <ImageWithFallback
                        src={material.image}
                        alt={material.name}
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 truncate">{material.name}</h4>
                        <p className="text-sm text-gray-600">{material.category} • {material.quantity}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={`${status.color} text-white text-xs`}>
                            {status.text}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            Expires {material.expiryDate}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => deleteMaterial(material.id)}
                        className="p-2 rounded-full bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Manual Modal */}
      {showAddManual && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
          <div className="bg-white rounded-t-3xl w-full overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">Add Ingredient Manually</h3>
              <button
                onClick={() => setShowAddManual(false)}
                className="p-2 rounded-full bg-gray-100 text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingredient Name
                </label>
                <Input
                  value={newMaterial.name}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Fresh Bananas"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expiry Date
                </label>
                <Input
                  type="date"
                  value={newMaterial.expiryDate}
                  onChange={(e) => setNewMaterial(prev => ({ ...prev, expiryDate: e.target.value }))}
                  className="w-full"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <Input
                    value={newMaterial.category}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="e.g., Fruits"
                    className="w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <Input
                    value={newMaterial.quantity}
                    onChange={(e) => setNewMaterial(prev => ({ ...prev, quantity: e.target.value }))}
                    placeholder="e.g., 6 pieces"
                    className="w-full"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleAddManual}
                disabled={!newMaterial.name || !newMaterial.expiryDate}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Ingredient
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}